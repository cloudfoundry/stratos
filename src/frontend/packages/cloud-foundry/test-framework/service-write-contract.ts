import { readFileSync } from 'node:fs';

import { HttpTestingController } from '@angular/common/http/testing';

/*
 * What the backend answers for a service write on each resolve path, recorded
 * by the Go TestServiceWritesContract from real Cloud Controller responses
 * (src/jetstream/plugins/cloudfoundry/testdata/cf-jobs). Specs answer their
 * writes from these files instead of hand-written bodies, so they see the
 * shapes CF really produces; a hand-written link key hid #6001.
 *
 * A write resolves on the fast path when CF finishes the job inside the
 * backend's window (200 with the result), and on the polled path when it
 * does not (202, then GET /pp/v1/stratos/jobs/{id}). Whether the broker is
 * synchronous or asynchronous decides which one a user gets, so every
 * behaviour has to hold on both.
 */

interface RecordedResponse<T = unknown> {
  status: number;
  body: T;
}

export interface ServiceWriteContract {
  fastPath: RecordedResponse;
  handoff: RecordedResponse<{ id: string }>;
  poll: RecordedResponse;
}

export type ResolvePath = 'fast' | 'polled';
export const RESOLVE_PATHS: readonly ResolvePath[] = ['fast', 'polled'];

/**
 * Loads a recorded write, e.g. `serviceWriteContract('async-service-instance-create')`.
 * Names are `<sync|async>-<operation>`, plus `failasync-…` and `syncfail-…` for
 * broker failures.
 */
export function serviceWriteContract(name: string): ServiceWriteContract {
  const url = new URL(`../../../../jetstream/plugins/cloudfoundry/testdata/cf-jobs/stratos/${name}.json`, import.meta.url);
  // Under vitest the module URL is served as file:///@fs/<absolute path>.
  const file = decodeURIComponent(url.pathname).replace(/^\/@fs\//, '/');
  return JSON.parse(readFileSync(file, 'utf8')) as ServiceWriteContract;
}

/** Answers the pending write to `url` the way the backend did on `path`. */
export async function answerServiceWrite(
  httpMock: HttpTestingController,
  url: string,
  contract: ServiceWriteContract,
  path: ResolvePath,
): Promise<void> {
  const write = httpMock.expectOne(url);
  if (path === 'fast') {
    write.flush(contract.fastPath.body, { status: contract.fastPath.status, statusText: 'Recorded' });
    return;
  }
  write.flush(contract.handoff.body, { status: contract.handoff.status, statusText: 'Accepted' });
  const pollUrl = `/pp/v1/stratos/jobs/${contract.handoff.body.id}`;
  // writeWithJob issues the first poll once the 202 has been handled; give it
  // a few microtasks to get there.
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
    const [poll] = httpMock.match(pollUrl);
    if (poll) {
      poll.flush(contract.poll.body, { status: contract.poll.status, statusText: 'OK' });
      return;
    }
  }
  throw new Error(`no poll of ${pollUrl} after the 202 handoff`);
}
