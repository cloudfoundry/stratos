import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StBuildpacksResponse, StStacksResponse, StUser, StUsersResponse } from '../../services/endpoint-data/stratos-types';

/**
 * Measure-on-demand blocks for the foundation shape page (GH #5702): the
 * dimensions the session registry never caches, fetched only on an explicit
 * click whose cost is stated up front. Results are keyed by endpoint and kept
 * for the session (root-provided) so a measurement survives navigation and
 * joins the shape with its own timestamp.
 */

/**
 * Ecosystem totals absent from the session registry; key = schema_version 1
 * totals name. isolation_segments is missing: jetstream has no GET list
 * handler for it yet (only the entitlement POST) — add the probe when the
 * backend grows one.
 */
export const TOTALS_PROBES: { key: string; label: string; path: string }[] = [
  { key: 'buildpacks', label: 'Buildpacks', path: 'buildpacks' },
  { key: 'stacks', label: 'Stacks', path: 'stacks' },
  { key: 'domains', label: 'Domains', path: 'domains' },
  { key: 'organization_quotas', label: 'Org quotas', path: 'organization_quotas' },
  { key: 'space_quotas', label: 'Space quotas', path: 'space_quotas' },
  { key: 'security_groups', label: 'Security groups', path: 'security_groups' },
  { key: 'users', label: 'Users', path: 'users' },
];

export interface MeasuredTotals {
  /** Probe key → count; null = that probe failed. */
  counts: Record<string, number | null>;
  fetchedAt: Date;
}

export interface MeasuredEcosystem {
  stacksDefined: string[];
  /** Duplicate names are real (same buildpack pinned to multiple stacks). */
  buildpacksDefined: string[];
  fetchedAt: Date;
}

/**
 * Users with their org and space role grants — the whole join arrives in the
 * one `/pp/v1/cf/users/{cnsi}` envelope, so this block costs a single request
 * however large the foundation is. It feeds the detail export's per-org and
 * per-space `roles`; the anonymous export never carries it.
 */
export interface MeasuredRoles {
  users: StUser[];
  fetchedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ShapeMeasureService {
  private readonly http = inject(HttpClient);

  private readonly _totals = signal<ReadonlyMap<string, MeasuredTotals>>(new Map());
  private readonly _ecosystem = signal<ReadonlyMap<string, MeasuredEcosystem>>(new Map());
  private readonly _roles = signal<ReadonlyMap<string, MeasuredRoles>>(new Map());
  private readonly _inFlight = signal<ReadonlySet<string>>(new Set());

  readonly totals = this._totals.asReadonly();
  readonly ecosystem = this._ecosystem.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly inFlight = this._inFlight.asReadonly();

  totalsCost(): string {
    return `${TOTALS_PROBES.length} requests`;
  }

  ecosystemCost(): string {
    return '2 requests';
  }

  rolesCost(): string {
    return '1 request';
  }

  measureTotals(guid: string): void {
    const key = `${guid}:totals`;
    if (!this.begin(key)) {
      return;
    }
    const probes: Record<string, ReturnType<typeof this.countProbe>> = {};
    for (const probe of TOTALS_PROBES) {
      probes[probe.key] = this.countProbe(guid, probe.path);
    }
    forkJoin(probes).subscribe(counts => {
      this._totals.update(all => new Map(all).set(guid, { counts, fetchedAt: new Date() }));
      this.end(key);
    });
  }

  measureEcosystem(guid: string): void {
    const key = `${guid}:ecosystem`;
    if (!this.begin(key)) {
      return;
    }
    forkJoin({
      stacks: this.http.get<StStacksResponse>(`/pp/v1/cf/stacks/${guid}`).pipe(catchError(() => of(null))),
      buildpacks: this.http.get<StBuildpacksResponse>(`/pp/v1/cf/buildpacks/${guid}`).pipe(catchError(() => of(null))),
    }).subscribe(({ stacks, buildpacks }) => {
      // simplification: all-or-nothing — a partial defined-list would silently
      // skew the defined-vs-used comparison; retry is one click away.
      if (stacks && buildpacks) {
        this._ecosystem.update(all =>
          new Map(all).set(guid, {
            stacksDefined: stacks.resources.map(s => s.name),
            buildpacksDefined: buildpacks.resources.map(b => b.name),
            fetchedAt: new Date(),
          })
        );
      }
      this.end(key);
    });
  }

  // Fetched here rather than through CnsiUsersSnapshotService because that
  // service reports a failed fetch as an empty user list — which this page
  // would then export as "measured, nobody has a role". A failure has to stay
  // distinguishable from an empty foundation, so nothing is recorded on error
  // and the retry is one click away.
  measureRoles(guid: string): void {
    const key = `${guid}:roles`;
    if (!this.begin(key)) {
      return;
    }
    this.http
      .get<StUsersResponse>(`/pp/v1/cf/users/${guid}`)
      .pipe(catchError(() => of(null)))
      .subscribe(response => {
        if (response) {
          this._roles.update(all =>
            new Map(all).set(guid, { users: response.resources ?? [], fetchedAt: new Date() })
          );
        }
        this.end(key);
      });
  }

  private countProbe(guid: string, path: string) {
    return this.http.get<{ totalResults: number }>(`/pp/v1/cf/${path}/${guid}?return=counts`).pipe(
      map(r => r?.totalResults ?? 0),
      catchError(() => of<number | null>(null))
    );
  }

  private begin(key: string): boolean {
    if (this._inFlight().has(key)) {
      return false;
    }
    this._inFlight.update(set => new Set(set).add(key));
    return true;
  }

  private end(key: string): void {
    this._inFlight.update(set => {
      const next = new Set(set);
      next.delete(key);
      return next;
    });
  }
}
