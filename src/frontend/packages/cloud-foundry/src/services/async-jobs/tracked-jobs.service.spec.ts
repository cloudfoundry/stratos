import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TailwindSnackBarService } from '@stratosui/core';
import { AuthDataService } from '@stratosui/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratosJob } from './async-job.types';
import { TrackedJob, TrackedJobsService } from './tracked-jobs.service';
import { jobTrackingLimitMs, setJobTrackingLimit } from './write-with-job';

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
    snackBar = { open: vi.fn(() => ({ dismiss: vi.fn() })), error: vi.fn() };
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

  // Snackbars stack: the 10 s "still running" message must not outlive the
  // message that says how the write ended.
  it('takes the still-running message down when it reports the outcome', async () => {
    for (const end of [
      (r: { flush: (b: object, o?: object) => void }) => r.flush(job('j1', 'COMPLETE')),
      (r: { flush: (b: object, o?: object) => void }) => r.flush(job('j1', 'FAILED', 'the broker said no')),
      (r: { flush: (b: object, o?: object) => void }) => r.flush({}, { status: 401, statusText: 'Unauthorized' }),
    ]) {
      snackBar.open.mockClear();
      snackBar.error.mockClear();
      localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
      sessionValid.set(false);
      TestBed.tick();
      TestBed.inject(TrackedJobsService);
      signIn('u1');
      const running = snackBar.open.mock.results[0].value.dismiss as ReturnType<typeof vi.fn>;
      expect(running).not.toHaveBeenCalled();
      end(httpMock.expectOne(jobUrl('j1')));
      await vi.advanceTimersByTimeAsync(0);
      expect(running).toHaveBeenCalledOnce();
      const outcome = [...snackBar.open.mock.invocationCallOrder.slice(1), ...snackBar.error.mock.invocationCallOrder];
      expect(outcome).toHaveLength(1);
      expect(running.mock.invocationCallOrder[0]).toBeLessThan(outcome[0]);
    }
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
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now() - jobTrackingLimitMs() + 60_000)]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    for (let i = 0; i < 40; i++) {
      httpMock.match(jobUrl('j1')).forEach(r => r.flush(job('j1', 'PROCESSING')));
      await vi.advanceTimersByTimeAsync(3000);
    }
    expect(snackBar.error).toHaveBeenCalledWith(
      'Create service instance "db": still running in Cloud Foundry after 1 h, so Stratos stopped checking on '
        + 'it. The Services list shows its current state.');
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

  it('follows for as long as the console is configured to', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
    TestBed.inject(TrackedJobsService);
    sessionData.set({ user: { guid: 'u1' }, config: { jobTrackingLimitMins: 2 } } as never);
    sessionValid.set(true);
    TestBed.tick();
    expect(jobTrackingLimitMs()).toBe(2 * 60_000);
    for (let i = 0; i < 60; i++) {
      httpMock.match(jobUrl('j1')).forEach(r => r.flush(job('j1', 'PROCESSING')));
      await vi.advanceTimersByTimeAsync(3000);
    }
    expect(snackBar.error).toHaveBeenCalledWith(expect.stringContaining('still running in Cloud Foundry after 2 min'));
    setJobTrackingLimit(60);
  });

  it('resumes again when the same user signs back in without a reload', async () => {
    localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
    TestBed.inject(TrackedJobsService);
    signIn('u1');
    httpMock.expectOne(jobUrl('j1')).flush({}, { status: 401, statusText: 'Unauthorized' });
    await vi.advanceTimersByTimeAsync(0);
    sessionValid.set(false);
    TestBed.tick();
    signIn('u1');
    expect(httpMock.match(jobUrl('j1')).length).toBe(1);
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

  describe('with other tabs open', () => {
    // Web Locks, shared by every tab of the site: one queue per name, each
    // request granted when the one before it is released.
    let tails: Map<string, Promise<unknown>>;
    const request = (name: string, opts: { signal?: AbortSignal }, cb: () => Promise<unknown>): Promise<unknown> => {
      const granted = (tails.get(name) ?? Promise.resolve()).then(() => {
        if (opts.signal?.aborted) {
          throw new DOMException('aborted', 'AbortError');
        }
        return cb();
      });
      tails.set(name, granted.catch(() => undefined));
      return granted;
    };
    // Another tab following a job until the returned function is called.
    const otherTabFollows = (jobId: string): (() => void) => {
      let release!: () => void;
      void request(`stratos.trackedJob.${jobId}`, {}, () => new Promise<void>(r => { release = r; }));
      return () => release();
    };

    beforeEach(() => {
      tails = new Map();
      Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    });

    afterEach(() => {
      delete (navigator as { locks?: unknown }).locks;
    });

    it('leaves a write another tab is following to it, and takes over if that tab closes first', async () => {
      localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
      const closeOtherTab = otherTabFollows('j1');
      TestBed.inject(TrackedJobsService);
      signIn('u1');
      await vi.advanceTimersByTimeAsync(0);
      httpMock.expectNone(jobUrl('j1'));
      expect(snackBar.open).not.toHaveBeenCalled();

      closeOtherTab();   // the record is still there: nobody saw the write end
      await vi.advanceTimersByTimeAsync(0);
      expect(snackBar.open).toHaveBeenCalledWith(expect.stringContaining('is still running'), 'Dismiss', { duration: 10000 });
      httpMock.expectOne(jobUrl('j1')).flush(job('j1', 'COMPLETE'));
      await vi.advanceTimersByTimeAsync(0);
      expect(snackBar.open).toHaveBeenLastCalledWith('Service instance "db" created.', 'Dismiss', { duration: 4000 });
    });

    it('says nothing about a write the other tab followed to its end', async () => {
      localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
      const otherTabDone = otherTabFollows('j1');
      TestBed.inject(TrackedJobsService);
      signIn('u1');
      await vi.advanceTimersByTimeAsync(0);
      localStorage.setItem('stratos.trackedJobs.u1', '[]');   // the other tab reported it and forgot it
      otherTabDone();
      await vi.advanceTimersByTimeAsync(0);
      httpMock.expectNone(jobUrl('j1'));
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('stops waiting for another tab when the session ends', async () => {
      localStorage.setItem('stratos.trackedJobs.u1', JSON.stringify([record('j1', Date.now())]));
      const closeOtherTab = otherTabFollows('j1');
      TestBed.inject(TrackedJobsService);
      signIn('u1');
      await vi.advanceTimersByTimeAsync(0);
      sessionValid.set(false);
      TestBed.tick();
      closeOtherTab();
      await vi.advanceTimersByTimeAsync(0);
      httpMock.expectNone(jobUrl('j1'));
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('keeps other tabs off a write this page holds until it lets go', async () => {
      const svc = TestBed.inject(TrackedJobsService);
      signIn('u1');
      const release = svc.hold('j1');
      const otherTab = vi.fn(async () => undefined);
      void request('stratos.trackedJob.j1', {}, otherTab);
      await vi.advanceTimersByTimeAsync(0);
      expect(otherTab).not.toHaveBeenCalled();
      release();
      await vi.advanceTimersByTimeAsync(0);
      expect(otherTab).toHaveBeenCalled();
    });
  });
});
