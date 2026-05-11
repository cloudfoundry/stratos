import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApplicationService } from '../../features/applications/application.service';
import { AppDetailDataService } from '../../features/applications/app-detail-data.service';

/**
 * AppVariableActionsService
 *
 * Per-variable verbs (add, update, delete) for the app-detail Variables
 * tab. Sibling to AppRouteActionsService — same lifetime contract:
 * tab-scoped, single in-flight verb at a time, transitioning-name signal
 * for per-row UI gating.
 *
 * Wire: `PATCH /pp/v1/cf/apps/{cnsi}/{app}` (handler `patchApp`).
 *
 * The Stratos PATCH is multi-field; for environment writes we send only
 * the `environment_json` field with the FULL desired user-defined env
 * map. CF v3's environment_variables semantics (PATCH
 * /v3/apps/{guid}/environment_variables) treat keys absent from the
 * payload as unchanged and explicit `null` values as deletes — but the
 * Stratos handler currently passes the map straight through, so to
 * delete a key we must omit it entirely AND ensure no other key is
 * silently dropped. Therefore the action service composes the new map
 * by reading the current `dataService.envVars().environment` snapshot
 * and applying the requested mutation locally before sending.
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
  private dataService = inject(AppDetailDataService);

  /** Name of the env var currently being mutated; null when idle.
   *  For "add", the value is the new variable name; for "update"/"delete",
   *  the existing name. */
  private readonly _transitioningName = signal<string | null>(null);
  readonly transitioningName = this._transitioningName.asReadonly();

  /** True while a per-variable verb is in flight. */
  readonly inFlight = computed(() => this._transitioningName() !== null);

  /**
   * Add a new user-defined environment variable. The full env map is
   * recomposed (current snapshot + new key) and sent as the
   * `environment_json` field of the Stratos PATCH.
   */
  async addVariable(name: string, value: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another variable action is already in flight');
    }
    const next = { ...this.currentEnv(), [name]: value };
    this._transitioningName.set(name);
    try {
      await this.patch(next);
    } finally {
      this._transitioningName.set(null);
    }
  }

  /**
   * Update an existing variable's value. Same wire shape as add — the
   * full map is sent. If the variable doesn't currently exist this
   * effectively becomes an add (no error).
   */
  async updateVariable(name: string, value: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another variable action is already in flight');
    }
    const next = { ...this.currentEnv(), [name]: value };
    this._transitioningName.set(name);
    try {
      await this.patch(next);
    } finally {
      this._transitioningName.set(null);
    }
  }

  /**
   * Delete a variable. The current map is shallow-cloned, the key
   * removed, and the resulting map sent as `environment_json`.
   */
  async deleteVariable(name: string): Promise<void> {
    if (this.inFlight()) {
      throw new Error('Another variable action is already in flight');
    }
    const next = { ...this.currentEnv() };
    delete next[name];
    this._transitioningName.set(name);
    try {
      await this.patch(next);
    } finally {
      this._transitioningName.set(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Snapshot of the current user-defined env map; defensively defaults
   *  to {} when envVars hasn't loaded yet. */
  private currentEnv(): Record<string, string> {
    return { ...(this.dataService.envVars()?.environment ?? {}) };
  }

  /** Send the PATCH with the merged environment map. The handler returns
   *  200 with `{guid, _meta?}`; partial success is surfaced via _meta but
   *  we leave inspection to the consumer (the snackbar wrapper). */
  private async patch(env: Record<string, string>): Promise<void> {
    const { cfGuid, appGuid } = this.applicationService;
    const url = `/pp/v1/cf/apps/${cfGuid}/${appGuid}`;
    await firstValueFrom(this.http.patch(url, { environment_json: env }));
  }
}
