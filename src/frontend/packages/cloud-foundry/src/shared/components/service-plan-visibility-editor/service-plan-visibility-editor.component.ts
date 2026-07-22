import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServicePlan, StServicePlanVisibility } from '../../../services/endpoint-data/stratos-types';

// One selectable organization row in the multi-org picker.
export interface VisibilityOrgOption {
  guid: string;
  name?: string;
}

// The four CF v3 visibility scopes. Only `organization` carries a
// multi-org selection; `public`/`admin` need no target and `space`
// is out of scope for this editor (single-space, handled elsewhere).
export type VisibilityType = 'public' | 'admin' | 'organization' | 'space';

// Editor for one service plan's visibility scope. The load-bearing
// affordance is multi-org selection: when type=organization the admin
// ticks N organizations and Apply writes all N guids to the plan in a
// single call via the native apply handler (POST replace / PATCH merge).
//
// Self-contained by design — the parent supplies the candidate org list
// via `organizations`, so the component owns no store wiring and stays
// unit-testable in isolation. Selection state mirrors the cf-users bulk
// pattern: a Set of guids, toggle + select-all + clear, a reactive count.
@Component({
  selector: 'app-service-plan-visibility-editor',
  templateUrl: './service-plan-visibility-editor.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ServicePlanVisibilityEditorComponent {
  private serviceCatalog = inject(ServiceCatalogDataService);

  @Input() servicePlan: StServicePlan | null = null;

  // Candidate orgs the admin can grant the plan to. Supplied by the
  // parent (which owns the org list fetch) so this component has no
  // store dependency and the multi-select is trivially testable.
  @Input() organizations: readonly VisibilityOrgOption[] = [];

  // Emits the applied visibility record once the write lands.
  @Output() applied = new EventEmitter<StServicePlanVisibility>();

  readonly visibilityTypes: readonly VisibilityType[] = ['public', 'admin', 'organization', 'space'];

  private readonly _type: WritableSignal<VisibilityType> = signal<VisibilityType>('organization');
  readonly type: Signal<VisibilityType> = this._type.asReadonly();

  // Multi-org selection: the set of chosen org guids. Empty on init; the
  // admin ticks rows to build up N targets before applying.
  private readonly _selectedOrgGuids: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());
  readonly selectedOrgGuids: Signal<ReadonlySet<string>> = this._selectedOrgGuids.asReadonly();

  readonly selectedCount: Signal<number> = computed(() => this._selectedOrgGuids().size);

  // Apply is enabled only when the request is well-formed: an
  // organization-scoped apply needs at least one org selected; the other
  // scopes need no target.
  readonly canApply: Signal<boolean> = computed(() => {
    if (!this.servicePlan) {
      return false;
    }
    if (this._type() === 'organization') {
      return this._selectedOrgGuids().size > 0;
    }
    return true;
  });

  private readonly _applySource = signal<ReturnType<ServiceCatalogDataService['applyPlanVisibility']> | null>(null);
  readonly isApplying: Signal<boolean> = computed(() => this._applySource()?.isLoading() ?? false);
  readonly applyError = computed(() => this._applySource()?.error() ?? null);

  // Bridges the SignalSource result to the @Output: once a write lands
  // (value flips from null to the applied record), re-emit it to the
  // parent exactly once so the read-only badge can refresh.
  private _lastEmitted: StServicePlanVisibility | null = null;
  constructor() {
    effect(() => {
      const applied = this._applySource()?.value() ?? null;
      if (applied && applied !== this._lastEmitted) {
        this._lastEmitted = applied;
        this.applied.emit(applied);
      }
    });
  }

  setType(type: VisibilityType): void {
    this._type.set(type);
  }

  isOrgSelected(guid: string): boolean {
    return this._selectedOrgGuids().has(guid);
  }

  toggleOrg(guid: string): void {
    const next = new Set(this._selectedOrgGuids());
    if (next.has(guid)) {
      next.delete(guid);
    } else {
      next.add(guid);
    }
    this._selectedOrgGuids.set(next);
  }

  selectAllOrgs(): void {
    this._selectedOrgGuids.set(new Set(this.organizations.map(o => o.guid)));
  }

  clearOrgs(): void {
    this._selectedOrgGuids.set(new Set<string>());
  }

  // Writes the current scope to the plan. For type=organization this
  // forwards ALL selected org guids in one apply call — the multi-org
  // fan-out the surface exists for. Re-emits the result to the parent so
  // it can refresh the read-only visibility badge.
  apply(mode: 'replace' | 'merge' = 'replace'): void {
    const plan = this.servicePlan;
    if (!plan || !this.canApply()) {
      return;
    }
    const orgGuids = this._type() === 'organization' ? Array.from(this._selectedOrgGuids()) : [];
    const source = this.serviceCatalog.applyPlanVisibility(
      plan.cnsiGuid,
      plan.guid,
      this._type(),
      orgGuids,
      mode,
    );
    this._applySource.set(source);
  }
}
