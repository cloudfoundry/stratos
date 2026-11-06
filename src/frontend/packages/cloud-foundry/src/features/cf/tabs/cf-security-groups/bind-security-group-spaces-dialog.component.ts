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

import {
  MAT_DIALOG_DATA,
  TailwindDialogRef,
  TailwindSnackBarService,
} from '@stratosui/core';

import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import { extractHttpErrorMessage } from '../../../../services/extract-error-message';
import type { StSpace } from '../../../../services/endpoint-data/stratos-types';
import {
  CfSecurityGroupsSignalConfigService,
  SecurityGroupSpaceBindLifecycle,
} from '../../../../shared/signal-list-configs/cf-security-groups/cf-security-groups-signal-config.service';

// ─── Dialog data ──────────────────────────────────────────────────────────────

export interface BindSecurityGroupSpacesDialogData {
  cfGuid: string;
  sgGuid: string;
  sgName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Multi-select "Bind to spaces" dialog opened from the CF-level Security
// Groups tab. Lists every space on the foundation with a checkbox and binds
// THIS security group to the selected set in one call, for the chosen
// lifecycle (running or staging). Backend POST
// /pp/v1/cf/security_groups/{cnsi}/{sg}/relationships/{running,staging}_spaces,
// body { guids: [...] }. Mirrors the apply-quota-to-orgs bulk pattern
// (single entity → multi-select targets), with an added running/staging
// lifecycle toggle since CF models the two bindings as distinct sub-resources.
@Component({
  selector: 'app-bind-security-group-spaces-dialog',
  templateUrl: './bind-security-group-spaces-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class BindSecurityGroupSpacesDialogComponent {
  private dialogRef = inject<TailwindDialogRef<BindSecurityGroupSpacesDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<BindSecurityGroupSpacesDialogData>(MAT_DIALOG_DATA);

  private securityGroupsConfig = inject(CfSecurityGroupsSignalConfigService);
  private snackBar = inject(TailwindSnackBarService);

  // Per-CNSI space source. acquire() returns the shared EndpointDataService
  // for this foundation (same instance the spaces list + endpoint service use),
  // so spaces() is often already populated; loadSpaces() below is a
  // cache-aware no-op in that case.
  private endpointData = inject(EndpointDataRegistry).acquire(this.data.cfGuid);

  protected readonly spaces: Signal<StSpace[]> = this.endpointData.spaces;
  protected readonly loading: Signal<boolean> = this.endpointData.isLoadingSpaces;

  // Running vs staging lifecycle — CF binds a group to a space independently
  // per lifecycle, so the operator picks exactly one per bind.
  protected readonly lifecycle: WritableSignal<SecurityGroupSpaceBindLifecycle> = signal('running');

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

  protected setLifecycle(lifecycle: SecurityGroupSpaceBindLifecycle): void {
    this.lifecycle.set(lifecycle);
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
    const lifecycle = this.lifecycle();
    try {
      await this.securityGroupsConfig.bindSpaces(this.data.cfGuid, this.data.sgGuid, guids, lifecycle);
      const n = guids.length;
      this.snackBar.show(
        `Bound "${this.data.sgName}" to ${n} ${n === 1 ? 'space' : 'spaces'} (${lifecycle})`,
      );
      // M1: do NOT touch `submitting` after close() — the view is destroyed.
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.snackBar.error(`Bind failed: ${extractHttpErrorMessage(err)}`);
      this.submitting.set(false);
    }
  }
}
