import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApplicationService } from '../../features/applications/application.service';

/**
 * AppVariableActionsService
 *
 * Per-variable verbs (add, update, delete, rename) for the app-detail
 * Variables tab. Sibling to AppRouteActionsService — same lifetime
 * contract: tab-scoped, single in-flight verb at a time, transitioning-name
 * signal for per-row UI gating.
 *
 * Wire: `PATCH /pp/v1/cf/apps/{cnsi}/{app}` (handler `patchApp`), sending
 * only the `environment_json` field.
 *
 * CF v3's environment_variables semantics (PATCH
 * /v3/apps/{guid}/environment_variables, which the Stratos handler forwards
 * verbatim) are merge-patch: a key present with a value is set/updated, a
 * key present with explicit `null` is DELETED, and a key absent from the
 * payload is left unchanged. We therefore send a minimal DELTA per verb —
 * never the full recomposed map — so:
 *   - add/update   -> { name: value }
 *   - delete       -> { name: null }              (omission would no-op)
 *   - rename        -> { oldName: null, newName: value }   (one PATCH)
 * Sending only the delta also avoids clobbering concurrent mutations and
 * removes the need to read a (possibly stale) full snapshot.
 *
 * Note: an empty-string value is a real, distinct value — `''` is sent as
 * `''` (present, empty); only delete/rename send `null`. Values are always
 * strings on the wire (CF rejects non-string values); `null` means delete.
 *
 * On success the consumer is expected to call `dataService.refresh('envVars')`
 * so the next read sees the canonical CF view (handles concurrent mutators).
 * Mirrors slice-3 routes pattern: action service stays focused on the verb
 * call + transition signalling; cache eviction / refresh is the consumer's
 * responsibility.
 */
@Injectable()
export class AppVariableActionsService {
  private http = inject(HttpClient);
  private applicationService = inject(ApplicationService);

  /** Name of the env var currently being mutated; null when idle.
   *  For "add", the value is the new variable name; for "update"/"delete",
   *  the existing name. */
  private readonly _transitioningName = signal<string | null>(null);
  readonly transitioningName = this._transitioningName.asReadonly();

  /** True while a per-variable verb is in flight. */
  readonly inFlight = computed(() => this._transitioningName() !== null);

  /**
   * Add a new user-defined environment variable. Sends a single-key delta
   * `{ name: value }`; CF merge-patch sets the key and leaves the rest
   * untouched.
   */
  async addVariable(name: string, value: string): Promise<void> {
    await this.run(name, { [name]: value });
  }

  /**
   * Update an existing variable's value. Same single-key delta as add —
   * if the variable doesn't currently exist this effectively becomes an
   * add (CF merge-patch, no error).
   */
  async updateVariable(name: string, value: string): Promise<void> {
    await this.run(name, { [name]: value });
  }

  /**
   * Delete a variable via explicit `null` (CF merge-patch delete). Omitting
   * the key would be a no-op — it MUST be sent as `null` to remove it.
   */
  async deleteVariable(name: string): Promise<void> {
    await this.run(name, { [name]: null });
  }

  /**
   * Rename a variable (and optionally change its value) in one PATCH:
   * remove the old key (`null`) and set the new key to `value`. The
   * transitioning name reflects the new (target) key.
   */
  async renameVariable(oldName: string, newName: string, value: string): Promise<void> {
    await this.run(newName, { [oldName]: null, [newName]: value });
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Shared verb runner: reentrancy guard + transition signalling around a
   *  single delta PATCH. */
  private async run(transitioningName: string, delta: Record<string, string | null>): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another variable action is already in flight');
    }
    this._transitioningName.set(transitioningName);
    try {
      await this.patch(delta);
    } finally {
      this._transitioningName.set(null);
    }
  }

  /** Send the PATCH with the environment delta. The handler returns 200
   *  with `{guid, _meta?}`; partial success is surfaced via _meta but we
   *  leave inspection to the consumer (the snackbar wrapper). */
  private async patch(env: Record<string, string | null>): Promise<void> {
    const { cfGuid, appGuid } = this.applicationService;
    const url = `/pp/v1/cf/apps/${cfGuid}/${appGuid}`;
    await firstValueFrom(this.http.patch(url, { environment_json: env }));
  }
}
