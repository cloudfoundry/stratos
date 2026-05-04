// Stratos-native async-job contract, frontend side.
//
// Mirrors src/jetstream/plugins/stratosjobs/types.go. Kept in sync by
// hand — the backend types are authoritative; this file translates them
// into TypeScript for consumer code.
//
// Design doc: KS stratos/docs/2026-04-22-async-job-contract.md

export type JobState = 'PROCESSING' | 'COMPLETE' | 'FAILED';

export const isTerminalJobState = (s: JobState): boolean =>
  s === 'COMPLETE' || s === 'FAILED';

// JobStage mirrors the Go JobStage struct in
// src/jetstream/plugins/stratosjobs/types.go.
// Tracks a single step within a multi-stage async job (e.g. staging pipeline).
export interface JobStage {
  code: string;       // wire dedup key — e.g. "PACKAGE_LOOKUP", "BUILD_CREATE"
  label: string;      // human-readable step name
  index: number;      // 1-based position; 0 if unknown
  of: number;         // total step count; 0 if unknown
  enteredAt: string;  // ISO-8601 timestamp (Go time.Time marshals to ISO string)
}

export interface StratosError {
  code: string;
  message: string;
  detail?: unknown;
}

export interface StratosJob {
  id: string;
  kind: string;
  state: JobState;
  startedAt: string;
  updatedAt: string;
  errors?: StratosError[];
  result?: unknown;
  stages?: JobStage[];
}

// AsyncJobResult is what writeWithJob resolves to. `state` is the terminal
// result payload when the op COMPLETEd (200 sync-fast or terminal after
// polling). `jobId` is populated only when the call went through the 202
// handoff path — callers can use it for diagnostics / error correlation.
// `status` discriminates COMPLETE vs UNKNOWN; FAILED throws StratosJobError
// instead of returning, so consumers don't have to branch on status to
// detect failure.
export type AsyncJobStatus = 'COMPLETE' | 'UNKNOWN';

export interface AsyncJobResult<T> {
  status: AsyncJobStatus;
  state: T | undefined;
  jobId?: string;
}

// StratosJobError is thrown when a polled job terminates in FAILED. It
// carries the full terminal StratosJob so consumers can render CF-specific
// error details where useful.
export class StratosJobError extends Error {
  readonly job: StratosJob;

  constructor(job: StratosJob) {
    const first = job.errors?.[0];
    super(first ? `${first.code}: ${first.message}` : `job ${job.id} failed`);
    this.name = 'StratosJobError';
    this.job = job;
  }
}
