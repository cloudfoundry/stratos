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
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StSpace } from '../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../services/extract-error-message';

// ─── Dialog data ──────────────────────────────────────────────────────────────

export interface ShareServiceInstanceDialogData {
  cfGuid: string;
  siGuid: string;
  siName: string;
  /** The instance's own space — never a valid share target, filtered out. */
  ownerSpaceGuid?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Multi-select "Share to spaces" dialog opened from the service-instance
// detail page. Lists every space on the foundation with a checkbox and shares
// THIS managed instance with the selected set in one call via
// ServiceCatalogDataService.shareServiceInstanceWithSpaces (backend POST
// /pp/v1/cf/service_instances/{cnsi}/{si}/relationships/shared_spaces, body
// { guids: [...] }). Mirrors the org-quota "Apply to organizations" bulk
// pattern: a selection set of guids forwarded to a single write. CF only
// supports sharing managed instances, so the affordance is gated on the
// detail page (managed only).
@Component({
  selector: 'app-share-service-instance-dialog',
  templateUrl: './share-service-instance-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ShareServiceInstanceDialogComponent {
  private dialogRef = inject<TailwindDialogRef<ShareServiceInstanceDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<ShareServiceInstanceDialogData>(MAT_DIALOG_DATA);

  private serviceCatalog = inject(ServiceCatalogDataService);
  private snackBar = inject(TailwindSnackBarService);

  // Per-CNSI space source. acquire() returns the shared EndpointDataService
  // for this foundation (same instance the spaces list + endpoint service use),
  // so spaces() is already populated when the user navigated in through the CF
  // endpoint; loadSpaces() below is a cache-aware no-op in that case.
  private endpointData = inject(EndpointDataRegistry).acquire(this.data.cfGuid);

  // Candidate spaces = every space on the foundation except the instance's own
  // (an instance can't be shared with the space it already lives in).
  protected readonly spaces: Signal<StSpace[]> = computed(() =>
    this.endpointData.spaces().filter(s => s.guid !== this.data.ownerSpaceGuid),
  );
  protected readonly loading: Signal<boolean> = this.endpointData.isLoadingSpaces;

  // Selection set of space guids driving the checkbox column and the submit.
  private readonly _selected: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());
  protected readonly selectedCount: Signal<number> = computed(() => this._selected().size);

  protected readonly submitting: WritableSignal<boolean> = signal(false);

  /** Submit is enabled once at least one space is checked. */
  protected readonly canSubmit: Signal<boolean> = computed(
    () => this._selected().size > 0 && !this.submitting(),
  );

  constructor() {
    // Populate the space picker. Cache-aware loader: no-ops (returns cached) if
    // the spaces slice is already loaded, drains /pp/v1/cf/spaces/{cnsi}
    // otherwise.
    this.endpointData.loadSpaces().subscribe({ error: () => undefined });
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
        this.serviceCatalog.shareServiceInstanceWithSpaces(this.data.cfGuid, this.data.siGuid, guids),
      );
      const n = guids.length;
      this.snackBar.show(
        `Shared "${this.data.siName}" with ${n} ${n === 1 ? 'space' : 'spaces'}`,
      );
      // M1: do NOT touch `submitting` after close() — the view is destroyed.
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.snackBar.error(`Share failed: ${extractHttpErrorMessage(err)}`);
      this.submitting.set(false);
    }
  }
}
