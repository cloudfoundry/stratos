import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TailwindSnackBarService } from '@stratosui/core';
import { AuthDataService } from '@stratosui/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratosJob } from './async-job.types';
import { TRACK_FOR_MS, TrackedJob, TrackedJobsService } from './tracked-jobs.service';

const HOUR = 60 * 60_000;
const jobUrl = (id: string) => `/pp/v1/stratos/jobs/${id}`;
const job = (id: string, state: StratosJob['state'], detail?: string): StratosJob => ({
  id, kind: 'cf.service_instance.create', state, startedAt: '', updatedAt: '',
  errors: detail ? [{ code: 'CF-X', message: 'CF-X', detail }] : undefined,
} as StratosJob);

const record = (jobId: string, startedAt: number): TrackedJob => ({
  jobId,
  startedAt,
  running: 'Creating service instance "db"',
  done: 'Service instance "db" created.',
  failed: 'Failed to create service instance "db"',
  unknown: 'Create service instance "db"',
  where: 'The Services list',
});

describe('TrackedJobsService', () => {
  const sessionValid = signal(false);
  const sessionData = signal<{ user?: { guid: string } } | null>(null);
  let snackBar: { open: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let httpMock: HttpTestingController;

  const signIn = (guid: string) => {
    sessionData.set({ user: { guid } });
    sessionValid.set(true);
    TestBed.tick();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    localStorage.clear();
    sessionValid.set(false);
    sessionData.set(null);
    snackBar = { open: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthDataService, useValue: { sessionValid, sessionData } },
        { provide: TailwindSnackBarService, useValue: snackBar },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  const stored = (user: string): TrackedJob[] =>
    JSON.parse(localStorage.getItem(`stratos.trackedJobs.${user}`) ?? '[]');

  it('keeps what it tracks per user, in browser storage, until told to forget it', () => {
    const svc = TestBed.inject(TrackedJobsService);
    signIn('u1');
    svc.remember(record('j1', Date.now()));
    svc.remember(record('j1', Date.now()));   // the same job twice is one record
    svc.remember(record('j2', Date.now()));
    expect(stored('u1').map(r => r.jobId)).toEqual(['j1', 'j2']);
    svc.forget('j1');
    expect(stored('u1').map(r => r.jobId)).toEqual(['j2']);
    expect(stored('u2')).toEqual([]);
  });

  it('after sign-in, says what is still running and for how long, then reports how it ended', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now() - 14 * 60_000)]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Creating service instance "db" is still running (14 min so far). The Services list shows its progress, '
        + 'and a message will say how it ended.',
      'Dismiss', { duration: 10000 },
    );
    httpMock.expectOne(jobUrl('j1')).flush(job('j1', 'PROCESSING'));
    await vi.advanceTimersByTimeAsync(500);
    httpMock.expectOne(jobUrl('j1')).flush(job('j1', 'COMPLETE'));
    await vi.advanceTimersByTimeAsync(0);
    expect(snackBar.open).toHaveBeenLastCalledWith('Service instance "db" created.', 'Dismiss', { duration: 4000 });
    expect(stored('u1')).toEqual([]);
  });

  it('reports a failure with the broker\'s reason', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    httpMock.expectOne(jobUrl('j1')).flush(job('j1', 'FAILED', 'the broker said no'));
    await vi.advanceTimersByTimeAsync(0);
    expect(snackBar.error).toHaveBeenCalledWith('Failed to create service instance "db": the broker said no');
    expect(stored('u1')).toEqual([]);
  });

  it('reports a job the backend no longer knows as an unknown result', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    httpMock.expectOne(jobUrl('j1')).flush({}, { status: 404, statusText: 'Not Found' });
    await vi.advanceTimersByTimeAsync(0);
    expect(snackBar.error).toHaveBeenCalledWith(
      'Create service instance "db": the operation ended, but its result could not be determined. '
        + 'The Services list shows the current state.');
    expect(stored('u1')).toEqual([]);
  });

  it('stops checking an hour after the write started, and says so', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now() - TRACK_FOR_MS + 60_000)]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    for (let i = 0; i < 40; i++) {
      httpMock.match(jobUrl('j1')).forEach(r => r.flush(job('j1', 'PROCESSING')));
      await vi.advanceTimersByTimeAsync(3000);
    }
    expect(snackBar.error).toHaveBeenCalledWith(
      'Creating service instance "db" was still running after 1 hour, so Stratos stopped checking on it. '
        + 'The Services list shows its current state.');
    expect(stored('u1')).toEqual([]);
  });

  it('gives a write found past the hour one last check', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now() - 2 * HOUR)]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    httpMock.expectOne(jobUrl('j1')).flush(job('j1', 'COMPLETE'));
    await vi.advanceTimersByTimeAsync(0);
    expect(snackBar.open).toHaveBeenLastCalledWith('Service instance "db" created.', 'Dismiss', { duration: 4000 });
  });

  it('keeps the record and says so when the session ends while checking', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now() - 5 * 60_000)]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    httpMock.expectOne(jobUrl('j1')).flush({}, { status: 401, statusText: 'Unauthorized' });
    await vi.advanceTimersByTimeAsync(0);
    expect(snackBar.error).toHaveBeenCalledWith(
      'Signed out while Creating service instance "db" was running (5 min so far). Its status will show after '
        + 'you sign in.');
    expect(stored('u1').map(r => r.jobId)).toEqual(['j1']);
  });

  it('resumes only the signed-in user\'s writes, once per sign-in, and not ones followed on this page', async () => {
    localStorage.setItem('stratos.trackedJobs.u2', JSON.stringify([record('other', Date.now())]));
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now()), record('live', Date.now())]));
    const svc = TestBed.inject(TrackedJobsService);
    svc.following.add('live');
    signIn('u1');
    sessionValid.set(false);
    TestBed.tick();
    sessionValid.set(true);
    TestBed.tick();
    expect(httpMock.match(jobUrl('j1')).length).toBe(1);
    httpMock.expectNone(jobUrl('live'));
    httpMock.expectNone(jobUrl('other'));
  });
});
