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

import { DomainDataService } from '../../../services/endpoint-data/domain-data.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { StOrg } from '../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../services/extract-error-message';

// ─── Dialog data ──────────────────────────────────────────────────────────────

export interface ShareDomainOrgsDialogData {
  cfGuid: string;
  domainGuid: string;
  domainName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Multi-select "Share to organizations" dialog for a private domain. Lists
// every organization on the foundation with a checkbox and shares THIS domain
// with the selected set in one call via DomainDataService.shareDomainWithOrgs
// (backend POST /pp/v1/cf/domains/{cnsi}/{domain}/relationships/
// shared_organizations, body { guids: [...] }). Mirrors the CF Users "Manage
// Roles" / apply-quota-to-orgs / entitle-iso-segment bulk pattern: a selection
// set of guids forwarded to a single write.
//
// NOTE: no domain list/detail page exists yet — this dialog is the entry point
// a future host surface opens. See the service godoc.
@Component({
  selector: 'app-share-domain-orgs-dialog',
  templateUrl: './share-domain-orgs-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ShareDomainOrgsDialogComponent {
  private dialogRef = inject<TailwindDialogRef<ShareDomainOrgsDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<ShareDomainOrgsDialogData>(MAT_DIALOG_DATA);

  private domainData = inject(DomainDataService);
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
        this.domainData.shareDomainWithOrgs(this.data.cfGuid, this.data.domainGuid, guids),
      );
      const n = guids.length;
      this.snackBar.show(
        `Shared "${this.data.domainName}" with ${n} ${n === 1 ? 'organization' : 'organizations'}`,
      );
      // M1: do NOT touch `submitting` after close() — the view is destroyed.
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.snackBar.error(`Share failed: ${extractHttpErrorMessage(err)}`);
      this.submitting.set(false);
    }
  }
}
