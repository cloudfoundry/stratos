import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, untracked } from '@angular/core';
import { TailwindSnackBarService } from '@stratosui/core';
import { AuthDataService } from '@stratosui/store';
import { StratosJobError } from './async-job.types';
import { unknownHow, unknownOutcomeMessage } from './unknown-outcome-message';
import { SignedOutError, jobTrackingLimitMs, pollJob, setJobTrackingLimit } from './write-with-job';

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
//
// Records are shared by every tab of the site; following a job means
// holding its Web Lock, so one tab follows it at a time. A tab resuming a
// job waits for the lock and then re-reads the record: gone means the tab
// that held it saw the job end, still there means that tab closed first.
@Injectable({ providedIn: 'root' })
export class TrackedJobsService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(TailwindSnackBarService);
  private readonly auth = inject(AuthDataService);
  private resumedFor?: string;
  private waiting?: AbortController;

  /** Jobs this page is already following, which a resume leaves alone. */
  readonly following = new Set<string>();

  constructor() {
    effect(() => {
      const session = this.auth.sessionData();
      const user = session?.user?.guid;
      if (!this.auth.sessionValid() || !user) {
        // Signed out or expired: resume again after the next sign-in, even
        // as the same user and without a reload.
        this.resumedFor = undefined;
        this.waiting?.abort();
        return;
      }
      setJobTrackingLimit(session?.config?.jobTrackingLimitMins);
      if (user !== this.resumedFor) {
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

  // The message for a write whose session ended while it was followed; the
  // page that started it uses it too.
  signedOut(job: Pick<TrackedJob, 'running' | 'startedAt'>): string {
    return `Signed out while ${job.running} was running (${coarseElapsed(Date.now() - job.startedAt)} so far). `
      + 'Its status will show after you sign in.';
  }

  /**
   * Keeps other tabs from resuming the job until the returned function is
   * called. Call it before remember(), so the lock is queued before any tab
   * can read the record.
   */
  hold(jobId: string): () => void {
    let release!: () => void;
    const held = new Promise<void>(r => { release = r; });
    void this.withLock(jobId, () => held);
    return release;
  }

  private resume(): void {
    this.waiting?.abort();
    const waiting = this.waiting = new AbortController();
    for (const job of this.read()) {
      if (!this.following.has(job.jobId)) {
        void this.withLock(job.jobId, async () => {
          const current = this.read().find(r => r.jobId === job.jobId);
          if (current && !this.following.has(job.jobId)) {
            await this.follow(current);
          }
        }, waiting.signal);
      }
    }
  }

  // Runs fn while holding the job's lock. Without Web Locks it runs at once,
  // and each tab follows on its own.
  private withLock(jobId: string, fn: () => Promise<void>, signal?: AbortSignal): Promise<unknown> {
    const locks = navigator.locks as LockManager | null | undefined;
    if (!locks) {
      return fn();
    }
    return locks.request(`stratos.trackedJob.${jobId}`, { signal }, fn)
      .catch(() => undefined);   // aborted by a sign-out; follow() handles its own errors
  }

  private async follow(job: TrackedJob): Promise<void> {
    this.following.add(job.jobId);
    // Snackbars stack: take this down before saying how the write ended.
    const running = this.snackBar.open(
      `${job.running} is still running (${coarseElapsed(Date.now() - job.startedAt)} so far). ${job.where} shows `
        + 'its progress, and a message will say how it ended.',
      'Dismiss', { duration: 10000 },
    );
    try {
      // A write found past the limit still gets one check before it stops.
      const result = await pollJob(this.http, job.jobId, {
        deadlineAt: job.startedAt + jobTrackingLimitMs(),
        pauseOnSignOut: true,
      });
      running.dismiss();
      if (result.status === 'COMPLETE') {
        this.snackBar.open(job.done, 'Dismiss', { duration: 4000 });
      } else {
        this.snackBar.error(unknownOutcomeMessage(job.unknown, job.where, unknownHow(result)));
      }
      this.forget(job.jobId);
    } catch (err: unknown) {
      running.dismiss();
      if (err instanceof SignedOutError) {
        this.snackBar.error(this.signedOut(job));
        return;
      }
      this.snackBar.error(err instanceof StratosJobError
        ? `${job.failed}: ${err.message}`
        : unknownOutcomeMessage(job.unknown, job.where, 'ended'));
      this.forget(job.jobId);
    } finally {
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
