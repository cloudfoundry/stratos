// RevisionsService — frontend wrapper for the App Revisions tab endpoints.
//
// Two backend routes (both under /pp/v1/cf/apps/{cnsi}/{app}/...):
//   GET  .../revisions  — read-only fan-out; plain http.get, no writeWithJob.
//   POST .../rollback   — write that creates a CF v3 deployment; goes through
//                         writeWithJob because the backend uses RunFastPath:
//                         200 = resolved synchronously, 202 = polled handoff.
//
// URL layout: apps comes BEFORE cnsi in the path.
// Backend source: src/jetstream/plugins/cloudfoundry/native_routes.go lines 62-63.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { AsyncJobResult } from '../../services/async-jobs/async-job.types';
import { writeWithJob } from '../../services/async-jobs/write-with-job';

// ── Wire types ───────────────────────────────────────────────────────────────

// One stage record in result.stages[] from the rollback state machine.
// Shape mirrors RollbackStageRecord in native_apps_rollback_v3.go.
export interface RollbackStageRecord {
  stage: 'deployment_create' | 'deployment_poll';
  state: string;
  startedAt?: string;
  endedAt?: string;
  detail?: string;
  error?: string;
}

// RevisionRow is the frontend projection of RevisionWithDeployed.
// Embedded capi.Revision fields accessed by the UI are lifted here so
// the template doesn't need unsafe dot-access through an opaque type.
export interface RevisionRow {
  guid: string;
  version: number;
  description: string;
  deployable: boolean;
  created_at: string;
  droplet?: { guid: string };
  deployed: boolean; // merged from /v3/apps/:guid/revisions/deployed
}

// PartialFlags mirrors PartialFlags in native_apps_revisions_v3.go.
// True means the corresponding sub-call degraded; the UI renders
// "Not Available" tristate cells rather than falsely zeroed data.
export interface PartialFlags {
  deployedUnknown: boolean;
  featureUnknown: boolean;
}

// RevisionsResponse mirrors the JSON envelope from GET .../revisions.
export interface RevisionsResponse {
  revisions: RevisionRow[];
  featureEnabled: boolean;
  partial: PartialFlags;
}

// RollbackOptions correspond to the optional fields in RollbackRequest
// (native_apps_writes.go line 280-285). strategy defaults to "rolling"
// server-side when omitted.
export interface RollbackOptions {
  strategy?: 'rolling' | 'canary';
  // maxInFlight and canarySteps are canary-only fields; the backend
  // accepts them now even if canary support lands in a later slice.
  maxInFlight?: number;
  canarySteps?: number[];
}

// RollbackResult is the terminal result payload the backend projects when
// state === COMPLETE (rollback_translator.go lines 86-93).
// stateChanged is reserved for future frontend use (did app state flip?).
export interface RollbackResult {
  appGuid: string;
  revisionGuid: string;
  strategy: string;
  deploymentGuid: string;
  stages: RollbackStageRecord[];
  stateChanged?: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RevisionsService {
  private readonly http = inject(HttpClient);

  // Fetches all revisions for an app, with deployed flags merged in.
  // Plain GET — not a write, so writeWithJob is not applicable here.
  listRevisions(cnsi: string, appGuid: string): Observable<RevisionsResponse> {
    return this.http.get<RevisionsResponse>(
      `/pp/v1/cf/apps/${cnsi}/${appGuid}/revisions`,
    );
  }

  // Rolls back the app to the specified revision via a CF v3 deployment.
  // Uses writeWithJob because the backend runs RunFastPath: 200 on fast
  // drain, 202 handoff when CF takes longer than the fast-path window.
  async rollback(
    cnsi: string,
    appGuid: string,
    revisionGuid: string,
    opts: RollbackOptions = {},
  ): Promise<AsyncJobResult<RollbackResult>> {
    const body: Record<string, unknown> = { revisionGuid, ...opts };
    const call = this.http.post(
      `/pp/v1/cf/apps/${cnsi}/${appGuid}/rollback`,
      body,
      { observe: 'response' },
    );
    return writeWithJob<RollbackResult>(this.http, call);
  }
}
