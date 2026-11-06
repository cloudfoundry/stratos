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
import { IsolationSegmentDataService } from '../../../services/endpoint-data/isolation-segment-data.service';
import { StOrg } from '../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../services/extract-error-message';

// ─── Dialog data ──────────────────────────────────────────────────────────────

export interface EntitleIsoSegmentOrgsDialogData {
  cfGuid: string;
  isoGuid: string;
  isoName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Multi-select "Entitle organizations" dialog for an isolation segment. Lists
// every organization on the foundation with a checkbox and entitles THIS
// segment to the selected set in one call via
// IsolationSegmentDataService.entitleOrgsToIsoSegment (backend POST
// /pp/v1/cf/isolation_segments/{cnsi}/{iso}/relationships/organizations, body
// { guids: [...] }). Mirrors the CF Users "Manage Roles" / apply-quota-to-orgs
// bulk pattern: selection set of guids forwarded to a single write.
//
// NOTE: no isolation-segment list/detail page exists yet — this dialog is the
// entry point a future host surface opens. See the service godoc.
@Component({
  selector: 'app-entitle-iso-segment-orgs-dialog',
  templateUrl: './entitle-iso-segment-orgs-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class EntitleIsoSegmentOrgsDialogComponent {
  private dialogRef = inject<TailwindDialogRef<EntitleIsoSegmentOrgsDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<EntitleIsoSegmentOrgsDialogData>(MAT_DIALOG_DATA);

  private isoData = inject(IsolationSegmentDataService);
  private snackBar = inject(TailwindSnackBarService);

  // Per-CNSI org source. acquire() returns the shared EndpointDataService for
  // this foundation (same instance the orgs list uses), so orgs() is already
  // populated when navigating in through the CF endpoint; loadOrgs() below is
  // cache-aware and no-ops in that case.
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
        this.isoData.entitleOrgsToIsoSegment(this.data.cfGuid, this.data.isoGuid, guids),
      );
      const n = guids.length;
      this.snackBar.show(
        `Entitled "${this.data.isoName}" to ${n} ${n === 1 ? 'organization' : 'organizations'}`,
      );
      // M1: do NOT touch `submitting` after close() — the view is destroyed.
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.snackBar.error(`Entitle failed: ${extractHttpErrorMessage(err)}`);
      this.submitting.set(false);
    }
  }
}
