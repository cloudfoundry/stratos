import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  MAT_DIALOG_DATA,
  TailwindDialogRef,
  TailwindSnackBarService,
} from '@stratosui/core';

import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { StOrg } from '../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../services/extract-error-message';

// ─── Dialog data ──────────────────────────────────────────────────────────────

export interface ApplyQuotaToOrgsDialogData {
  cfGuid: string;
  quotaGuid: string;
  quotaName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Multi-select "Apply to organizations" dialog opened from the CF-level org
// quota detail page. Lists every organization on the foundation with a
// checkbox and applies THIS quota to the selected set in one call via the
// existing QuotaDataService.applyOrgQuotaToOrgs wrapper (backend POST
// /pp/v1/cf/organization_quotas/{cnsi}/{quota}/relationships/organizations,
// body { data: [{ guid }, …] }). Mirrors the CF Users "Manage Roles" bulk
// pattern: selection set of guids forwarded to a single write.
@Component({
  selector: 'app-apply-quota-to-orgs-dialog',
  templateUrl: './apply-quota-to-orgs-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ApplyQuotaToOrgsDialogComponent {
  private dialogRef = inject<TailwindDialogRef<ApplyQuotaToOrgsDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<ApplyQuotaToOrgsDialogData>(MAT_DIALOG_DATA);

  private quotaData = inject(QuotaDataService);
  private snackBar = inject(TailwindSnackBarService);

  // Per-CNSI org source. acquire() returns the shared EndpointDataService
  // for this foundation (same instance the orgs list + endpoint service use),
  // so orgs() is already populated when the user navigated in through the CF
  // endpoint; loadOrgs() below is a cache-aware no-op in that case.
  private endpointData = inject(EndpointDataRegistry).acquire(this.data.cfGuid);

  protected readonly orgs: Signal<StOrg[]> = this.endpointData.orgs;
  protected readonly loading: Signal<boolean> = this.endpointData.isLoadingOrgs;

  // Selection set of org guids driving the checkbox column and the submit.
  private readonly _selected: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());
  protected readonly selectedCount: Signal<number> = computed(() => this._selected().size);

  protected readonly submitting: WritableSignal<boolean> = signal(false);

  /** Submit is enabled once at least one org is checked. */
  protected readonly canSubmit: Signal<boolean> = computed(
    () => this._selected().size > 0 && !this.submitting(),
  );

  constructor() {
    // Populate the org picker. Cache-aware loader: no-ops (returns cached) if
    // the orgs slice is already loaded, drains /pp/v1/cf/orgs/{cnsi} otherwise.
    this.endpointData.loadOrgs().subscribe({ error: () => undefined });
  }

  protected isSelected(guid: string): boolean {
    return this._selected().has(guid);
  }

  /** True when the org already carries this quota — surfaced as a hint, not a
   *  block (re-applying is idempotent on the CF side). */
  protected alreadyOnQuota(org: StOrg): boolean {
    return org.quotaGuid === this.data.quotaGuid;
  }

  protected toggle(guid: string): void {
    const next = new Set(this._selected());
    if (next.has(guid)) {
      next.delete(guid);
    } else {
      next.add(guid);
    }
    this._selected.set(next);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    const guids = Array.from(this._selected());
    try {
      await firstValueFrom(
        this.quotaData.applyOrgQuotaToOrgs(this.data.cfGuid, this.data.quotaGuid, guids),
      );
      const n = guids.length;
      this.snackBar.show(
        `Applied quota "${this.data.quotaName}" to ${n} ${n === 1 ? 'organization' : 'organizations'}`,
      );
      // Those orgs now link a different quota — mark the slice stale so the
      // orgs list refetches on next read rather than showing the old quota.
      this.endpointData.markStale('orgs');
      // M1: do NOT touch `submitting` after close() — the view is destroyed.
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.snackBar.error(`Apply failed: ${extractHttpErrorMessage(err)}`);
      this.submitting.set(false);
    }
  }
}
