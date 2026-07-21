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
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
  MAT_DIALOG_DATA,
  TailwindDialogRef,
  TailwindSnackBarService,
} from '@stratosui/core';

import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
import { StSpace } from '../../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../../services/extract-error-message';

// ─── Dialog data ────────────────────────────────────────────────────────────

export interface ApplyQuotaToSpacesDialogData {
  cfGuid: string;
  orgGuid: string;
  quotaGuid: string;
  /** Display-only — the quota being applied. */
  quotaName?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Multi-select dialog: pick N spaces in the quota's org and apply the quota to
// all of them in one backend call (QuotaDataService.applySpaceQuotaToSpaces →
// CF V3 POST /v3/space_quotas/{guid}/relationships/spaces). Opened from the
// space-quota detail page where the quota (and its org) are already fixed, so
// the only choice left is which spaces receive it.
@Component({
  selector: 'app-apply-quota-to-spaces-dialog',
  templateUrl: './apply-quota-to-spaces-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ApplyQuotaToSpacesDialogComponent {
  private dialogRef = inject<TailwindDialogRef<ApplyQuotaToSpacesDialogComponent, boolean>>(TailwindDialogRef);
  protected data = inject<ApplyQuotaToSpacesDialogData>(MAT_DIALOG_DATA);

  private http = inject(HttpClient);
  private quotaData = inject(QuotaDataService);
  private snackBar = inject(TailwindSnackBarService);

  protected readonly spaces: WritableSignal<StSpace[]> = signal<StSpace[]>([]);
  protected readonly loading: WritableSignal<boolean> = signal<boolean>(true);
  protected readonly loadError: WritableSignal<string | null> = signal<string | null>(null);
  protected readonly submitting: WritableSignal<boolean> = signal<boolean>(false);

  // Selected space guids — the checkbox column reads/writes this; canApply
  // derives from its size.
  protected readonly selected: WritableSignal<ReadonlySet<string>> = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedCount: Signal<number> = computed(() => this.selected().size);
  protected readonly canApply: Signal<boolean> = computed(
    () => this.selected().size > 0 && !this.submitting(),
  );

  constructor() {
    // Same spaces-in-org endpoint OrgDataService reads. Fetched fresh here so
    // the dialog is self-contained (no dependency on a warmed org-detail cache).
    this.http
      .get<{ resources: StSpace[]; totalResults: number }>(
        `/pp/v1/cf/org/${this.data.cfGuid}/${this.data.orgGuid}/spaces`,
      )
      .subscribe({
        next: resp => {
          this.spaces.set(resp?.resources ?? []);
          this.loading.set(false);
        },
        error: err => {
          this.loadError.set(extractHttpErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected isSelected(guid: string): boolean {
    return this.selected().has(guid);
  }

  protected toggle(guid: string): void {
    const next = new Set(this.selected());
    if (next.has(guid)) {
      next.delete(guid);
    } else {
      next.add(guid);
    }
    this.selected.set(next);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async apply(): Promise<void> {
    if (!this.canApply()) {
      return;
    }
    this.submitting.set(true);
    const guids = [...this.selected()];
    try {
      await firstValueFrom(
        this.quotaData.applySpaceQuotaToSpaces(this.data.cfGuid, this.data.quotaGuid, guids),
      );
      this.snackBar.open(
        `Quota applied to ${guids.length} ${guids.length === 1 ? 'space' : 'spaces'}`,
      );
      // Do NOT touch signals after close() — the view is destroyed.
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.snackBar.error(`Failed to apply quota: ${extractHttpErrorMessage(err)}`);
      this.submitting.set(false);
    }
  }
}
