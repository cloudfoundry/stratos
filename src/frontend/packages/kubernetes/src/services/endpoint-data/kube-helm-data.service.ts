import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TailwindSnackBarService } from '../../../../core/src/shared/services/tailwind-snackbar.service';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import {
  HelmInstallPayload,
  HelmRelease,
  HelmUpgradePayload,
  MonocularChart,
  StratosError,
} from './kube-types';

// Sibling to KubeEndpointDataService, scoped to the helm + monocular
// API surface. Mirrors CF's EndpointDataService 1:1 — releases +
// charts exposed as readonly signals, refresh()/install/upgrade/delete
// drive HTTP, errors funneled to the tristate envelope.
//
// Wire model (preserved verbatim from the legacy `helm/store/helm.effects.ts`
// and `kubernetes/workloads/store/workloads.effects.ts`):
//   - Helm releases:       GET    /pp/v1/helm/releases
//                          (response keyed by endpointId, value = HelmRelease[])
//   - Helm release detail: GET    /pp/v1/helm/releases/{endpoint}/{ns}/{name}
//   - Helm install:        POST   /pp/v1/helm/install
//                          (body = HelmInstallPayload)
//   - Helm upgrade:        POST   /pp/v1/helm/releases/{endpoint}/{ns}/{name}
//                          (body = HelmUpgradePayload)
//   - Helm delete:         DELETE /pp/v1/helm/releases/{endpoint}/{ns}/{name}
//   - Monocular charts:    GET    /pp/v1/chartsvc/v1/charts
//                          (no header = stratos repo; with x-cap-cnsi-list
//                           = artifact hub endpoint)
//
// Releases are stored cluster-wide (one signal across all helm endpoints)
// because the legacy contract returned a multi-endpoint dict and the
// helm-releases page renders cross-endpoint. Per-endpoint slicing happens
// in the view via `releasesForEndpoint(kubeGuid)`.

@Injectable({ providedIn: 'root' })
export class KubeHelmDataService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(TailwindSnackBarService);

  // --- Release state ---
  private readonly _releases = signal<HelmRelease[]>([]);
  private readonly _releasesLoading = signal<boolean>(false);
  private readonly _releasesLastFetched = signal<Date | null>(null);
  private readonly _releaseErrors = signal<StratosError[]>([]);

  // --- Charts state ---
  private readonly _charts = signal<MonocularChart[]>([]);
  private readonly _chartsLoading = signal<boolean>(false);
  private readonly _chartsLastFetched = signal<Date | null>(null);
  private readonly _chartErrors = signal<StratosError[]>([]);

  // --- Combined errors signal — merges release + chart envelopes so
  // a single page can pull "all helm-related errors" without juggling
  // two streams.
  readonly errorsSignal: Signal<StratosError[]> = computed(() => [
    ...this._releaseErrors(),
    ...this._chartErrors(),
  ]);

  // --- Public read API ---

  allReleases(): Signal<HelmRelease[]> {
    return this._releases.asReadonly();
  }

  releasesForEndpoint(kubeGuid: string): Signal<HelmRelease[]> {
    return computed(() => this._releases().filter(r => r.endpointId === kubeGuid));
  }

  monocularCharts(): Signal<MonocularChart[]> {
    return this._charts.asReadonly();
  }

  isLoadingReleases(): Signal<boolean> {
    return this._releasesLoading.asReadonly();
  }

  isLoadingCharts(): Signal<boolean> {
    return this._chartsLoading.asReadonly();
  }

  releasesLastFetched(): Signal<Date | null> {
    return this._releasesLastFetched.asReadonly();
  }

  chartsLastFetched(): Signal<Date | null> {
    return this._chartsLastFetched.asReadonly();
  }

  errors(): Signal<StratosError[]> {
    return this.errorsSignal;
  }

  // --- Load / refresh ---

  // Fetch releases across ALL connected helm-bearing endpoints. The
  // legacy effect calls /pp/v1/helm/releases without a CNSI header —
  // Jetstream fans the request out to every connected k8s endpoint and
  // returns a dict keyed by endpoint guid.
  async loadReleases(): Promise<void> {
    if (this._releasesLoading()) return;
    this._releasesLoading.set(true);
    this._releaseErrors.set([]);
    try {
      const resp = await firstValueFrom(
        this.http.get<Record<string, HelmRelease[] | null>>('/pp/v1/helm/releases'),
      );
      const all: HelmRelease[] = [];
      Object.keys(resp ?? {}).forEach(endpointId => {
        const list = resp[endpointId];
        if (!Array.isArray(list)) return;
        list.forEach(raw => {
          all.push(this.normalizeRelease(raw, endpointId));
        });
      });
      this._releases.set(all);
      this._releasesLastFetched.set(new Date());
    } catch (err) {
      this.recordError(this._releaseErrors, err, 'helm-releases');
    } finally {
      this._releasesLoading.set(false);
    }
  }

  // Fetch monocular charts. Request is unauthenticated (no x-cap-cnsi-list)
  // — Jetstream's chartsvc proxy fans across connected helm endpoints.
  // Wave-2 keeps the surface simple — a single fetch returns the merged
  // catalog. Per-endpoint refresh can layer on later if a use case shows
  // up.
  async loadCharts(): Promise<void> {
    if (this._chartsLoading()) return;
    this._chartsLoading.set(true);
    this._chartErrors.set([]);
    try {
      const resp = await firstValueFrom(
        this.http.get<{ data?: MonocularChart[] }>('/pp/v1/chartsvc/v1/charts'),
      );
      const items = (resp?.data ?? []).map(c => this.normalizeChart(c));
      this._charts.set(items);
      this._chartsLastFetched.set(new Date());
    } catch (err) {
      this.recordError(this._chartErrors, err, 'monocular-charts');
    } finally {
      this._chartsLoading.set(false);
    }
  }

  async refresh(scope?: { kubeGuid?: string }): Promise<void> {
    // Wave-2: a refresh just re-runs both legs. The optional kubeGuid
    // is accepted on the API per the design doc — if a future caller
    // needs per-endpoint targeting we can layer it on the loadReleases
    // path; today the legacy contract was always cluster-wide so we
    // don't pretend to filter.
    void scope;
    this._releasesLastFetched.set(null);
    this._chartsLastFetched.set(null);
    await Promise.all([this.loadReleases(), this.loadCharts()]);
  }

  // --- Mutating dialogs (install / upgrade / delete) ---
  //
  // The dialogs invoke these directly — no Store dispatch. Each method
  // is idempotent in the sense that it always re-fetches the release
  // list on success so the local cache reflects reality. Errors bubble
  // back to the caller as rejected promises with a normalized message.

  async install(payload: HelmInstallPayload): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/pp/v1/helm/install', payload));
      await this.loadReleases();
    } catch (err) {
      throw new Error(this.errorMessage(err, 'Failed to install helm chart'));
    }
  }

  async upgrade(
    kubeGuid: string,
    namespace: string,
    name: string,
    payload: HelmUpgradePayload,
  ): Promise<void> {
    const url = `/pp/v1/helm/releases/${kubeGuid}/${namespace}/${name}`;
    try {
      await firstValueFrom(this.http.post(url, payload));
      await this.loadReleases();
    } catch (err) {
      throw new Error(this.errorMessage(err, 'Failed to upgrade helm release'));
    }
  }

  async delete(kubeGuid: string, namespace: string, name: string): Promise<void> {
    const url = `/pp/v1/helm/releases/${kubeGuid}/${namespace}/${name}`;
    try {
      await firstValueFrom(this.http.delete(url));
      // Optimistic local removal — drop the row from the signal so the
      // UI updates immediately, then reconcile with the server fetch.
      this._releases.update(curr =>
        curr.filter(r => !(r.endpointId === kubeGuid && r.namespace === namespace && r.name === name)),
      );
      await this.loadReleases();
    } catch (err) {
      throw new Error(this.errorMessage(err, 'Failed to delete helm release'));
    }
  }

  // Trigger a Helm repository re-sync. Signal-native replacement for the
  // legacy `helmSynchronise$` ngrx effect (which was orphaned when the
  // Angular-20 NgModule removal dropped its EffectsModule registration).
  // POSTs to the chartrepos sync endpoint and surfaces a snackbar; resolves
  // true on success so the caller can refresh the endpoint list.
  async synchronise(endpoint: EndpointModel): Promise<boolean> {
    const url = `/pp/v1/chartrepos/${endpoint.guid}`;
    try {
      await firstValueFrom(this.http.post(url, { headers: null, params: null }));
      this.snackBar.open('Helm Repository synchronization started', 'Dismiss', { duration: 3000 });
      return true;
    } catch {
      this.snackBar.error(`Failed to Synchronize Helm Repository '${endpoint.name}'`);
      return false;
    }
  }

  // --- Helpers ---

  private normalizeRelease(raw: HelmRelease, endpointId: string): HelmRelease {
    // Legacy guid format: `${endpointId}:${namespace}:${name}` — preserve
    // verbatim so existing routes (`/workloads/${guid}/summary`) continue
    // to resolve.
    const guid = `${endpointId}:${raw.namespace}:${raw.name}`;
    const last = this.mapHelmModifiedDate(raw.info?.last_deployed);
    const first = this.mapHelmModifiedDate(raw.info?.first_deployed);
    return {
      ...raw,
      endpointId,
      kubeGuid: endpointId,
      guid,
      status: raw.info?.status ?? raw.status ?? 'unknown',
      lastDeployed: last,
      firstDeployed: first,
    };
  }

  private normalizeChart(raw: MonocularChart): MonocularChart {
    // Promote `attributes.name` to top-level `name` to match legacy
    // contract (downstream cells expect `row.name`).
    return {
      ...raw,
      name: raw.attributes?.name ?? raw.name,
    };
  }

  // Helm proto-timestamp normalization. The wire format is
  // `{ seconds: number, nanos: number }`; we collapse to a JS Date.
  // Returns undefined when the input is missing or malformed so cells
  // can render an empty string rather than `Invalid Date`.
  private mapHelmModifiedDate(raw: unknown): Date | undefined {
    if (!raw) return undefined;
    if (raw instanceof Date) return raw;
    if (typeof raw === 'string') {
      const t = Date.parse(raw);
      return Number.isNaN(t) ? undefined : new Date(t);
    }
    if (typeof raw === 'object') {
      const r = raw as { seconds?: number; nanos?: number };
      if (typeof r.seconds === 'number') {
        const ms = r.seconds * 1000 + (r.nanos ?? 0) / 1_000_000;
        return new Date(Math.floor(ms));
      }
    }
    return undefined;
  }

  private recordError(
    target: { update: (fn: (curr: StratosError[]) => StratosError[]) => void },
    err: unknown,
    title: string,
  ): void {
    const status = (err as HttpErrorResponse)?.status;
    const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
    const next: StratosError = {
      scope: 'envelope',
      code,
      title,
      detail: this.unwrapErrorMessage(err),
    };
    target.update(curr => [...curr, next].slice(0, 50));
  }

  private errorMessage(err: unknown, fallback: string): string {
    const detail = this.unwrapErrorMessage(err);
    return detail ? `${fallback}: ${detail}` : fallback;
  }

  private unwrapErrorMessage(err: unknown): string {
    if (!err) return '';
    const httpErr = err as HttpErrorResponse;
    // Jetstream wraps backend errors as { error: { message, status } }
    const inner = httpErr?.error;
    if (inner && typeof inner === 'object') {
      const innerMsg = (inner as { message?: string; status?: string }).message
        ?? (inner as { status?: string }).status;
      if (innerMsg) return innerMsg;
    }
    if (httpErr?.message) return httpErr.message;
    if (err instanceof Error) return err.message;
    return String(err);
  }
}
