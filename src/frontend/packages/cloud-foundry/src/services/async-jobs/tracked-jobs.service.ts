import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, untracked } from '@angular/core';
import { TailwindSnackBarService } from '@stratosui/core';
import { AuthDataService } from '@stratosui/store';
import { StratosJobError } from './async-job.types';
import { unknownOutcomeMessage } from './unknown-outcome-message';
import { SignedOutError, pollJob } from './write-with-job';

/** How long a write is followed, counted from when it started. */
export const TRACK_FOR_MS = 60 * 60_000;
// A write found past TRACK_FOR_MS (the browser was closed, or signed out,
// for longer) still gets this long to report how it ended.
const LAST_CHECK_MS = 15_000;

/** Coarse elapsed time: seconds under a minute, whole minutes after. */
export const coarseElapsed = (ms: number): string => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min`;
};

/** A handed-off write, kept so its outcome can be reported after a reload or a new sign-in. */
export interface TrackedJob {
  jobId: string;
  /** ms since the epoch */
  startedAt: number;
  /** e.g. `Creating service instance "db"` */
  running: string;
  /** e.g. `Service instance "db" created.` */
  done: string;
  /** Lead-in for a failure, e.g. `Failed to create service instance "db"` */
  failed: string;
  /** Lead-in for an unknown result, e.g. `Create service instance "db"` */
  unknown: string;
  /** Where the current state shows, e.g. `The Services list` */
  where: string;
}

// The page that starts a write follows it while it is open. This keeps a
// record of each one in browser storage, per user, so that a reload or a
// sign-out does not lose it: once a session is valid, it resumes following
// the records the page did not, and reports each outcome.
@Injectable({ providedIn: 'root' })
export class TrackedJobsService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(TailwindSnackBarService);
  private readonly auth = inject(AuthDataService);
  private resumedFor?: string;

  /** Jobs this page is already following, which a resume leaves alone. */
  readonly following = new Set<string>();

  constructor() {
    effect(() => {
      const user = this.auth.sessionData()?.user?.guid;
      if (this.auth.sessionValid() && user && user !== this.resumedFor) {
        this.resumedFor = user;
        untracked(() => this.resume());
      }
    });
  }

  remember(job: TrackedJob): void {
    this.write([...this.read().filter(r => r.jobId !== job.jobId), job]);
  }

  forget(jobId: string): void {
    this.write(this.read().filter(r => r.jobId !== jobId));
  }

  /** Signal that aborts when the write that started at startedAt has been followed for TRACK_FOR_MS. */
  deadline(startedAt: number): { signal: AbortSignal; clear: () => void } {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(startedAt + TRACK_FOR_MS - Date.now(), LAST_CHECK_MS));
    return { signal: controller.signal, clear: () => clearTimeout(timeout) };
  }

  // Messages for the two ends that are not an outcome; the page that
  // started a write uses them too.
  stillRunningAfterLimit(job: Pick<TrackedJob, 'running' | 'where'>): string {
    return `${job.running} was still running after 1 hour, so Stratos stopped checking on it. `
      + `${job.where} shows its current state.`;
  }

  signedOut(job: Pick<TrackedJob, 'running' | 'startedAt'>): string {
    return `Signed out while ${job.running} was running (${coarseElapsed(Date.now() - job.startedAt)} so far). `
      + 'Its status will show after you sign in.';
  }

  private resume(): void {
    for (const job of this.read()) {
      if (!this.following.has(job.jobId)) {
        void this.follow(job);
      }
    }
  }

  private async follow(job: TrackedJob): Promise<void> {
    this.following.add(job.jobId);
    this.snackBar.open(
      `${job.running} is still running (${coarseElapsed(Date.now() - job.startedAt)} so far). ${job.where} shows `
        + 'its progress, and a message will say how it ended.',
      'Dismiss', { duration: 10000 },
    );
    const deadline = this.deadline(job.startedAt);
    try {
      const result = await pollJob(this.http, job.jobId, { signal: deadline.signal, pauseOnSignOut: true });
      if (result.status === 'COMPLETE') {
        this.snackBar.open(job.done, 'Dismiss', { duration: 4000 });
      } else {
        this.snackBar.error(unknownOutcomeMessage(job.unknown, job.where));
      }
      this.forget(job.jobId);
    } catch (err: unknown) {
      if (err instanceof SignedOutError) {
        this.snackBar.error(this.signedOut(job));
        return;
      }
      if (err instanceof StratosJobError) {
        this.snackBar.error(`${job.failed}: ${err.message}`);
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        this.snackBar.error(this.stillRunningAfterLimit(job));
      } else {
        this.snackBar.error(unknownOutcomeMessage(job.unknown, job.where));
      }
      this.forget(job.jobId);
    } finally {
      deadline.clear();
      this.following.delete(job.jobId);
    }
  }

  // Browser storage can be missing or refuse access (private windows,
  // blocked site data); tracking then lasts as long as the page.
  private key(): string | undefined {
    const user = this.auth.sessionData()?.user?.guid;
    return user ? `stratos.trackedJobs.${user}` : undefined;
  }

  private read(): TrackedJob[] {
    const key = this.key();
    try {
      const parsed: unknown = key ? JSON.parse(localStorage.getItem(key) ?? '[]') : [];
      return Array.isArray(parsed) ? parsed as TrackedJob[] : [];
    } catch {
      return [];
    }
  }

  private write(jobs: TrackedJob[]): void {
    const key = this.key();
    try {
      if (key) {
        localStorage.setItem(key, JSON.stringify(jobs));
      }
    } catch {
      // see key()
    }
  }
}
