import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import {
  MAT_DIALOG_DATA,
  TailwindDialogRef,
  StackedInputActionsComponent,
  StackedInputActionsState,
  StackedInputActionsUpdate,
  StackedInputActionConfig,
} from '@stratosui/core';

import { CfIdentityProvidersService } from '../../../../shared/data-services/cf-identity-providers.service';
import { AddMode, AddRoleSelection } from '../../../../shared/signal-list-configs/user/cf-users-add';

// ─── Dialog data ──────────────────────────────────────────────────────────────

export interface AddUserDialogData {
  cfGuid: string;
  /** When set, the org picker is locked (opened from an org or space page). */
  orgGuid?: string;
  orgName?: string;
  /** When set, the space picker is locked (opened from a space page). */
  spaceGuid?: string;
  spaceName?: string;
  /** Whether the UAA invite flow is allowed (feature-flag + admin). */
  userInviteAllowed: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    StackedInputActionsComponent,
  ],
})
export class AddUserDialogComponent {
  private dialogRef = inject<TailwindDialogRef<AddUserDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<AddUserDialogData>(MAT_DIALOG_DATA);

  private idps = inject(CfIdentityProvidersService);

  // ── Writable signals (field initializers — no `(this as {...})` casts) ────

  protected mode: WritableSignal<AddMode> = signal<AddMode>('associate');
  protected origin: WritableSignal<string> = signal<string>('uaa');
  protected originOptions: WritableSignal<string[]> = signal<string[]>([]);

  /** Values from StackedInputActionsComponent stateOut. */
  protected identities: WritableSignal<string[]> = signal<string[]>([]);
  protected identitiesValid: WritableSignal<boolean> = signal<boolean>(false);

  /** Optional role selection — roles are not required for submission. */
  protected selection: WritableSignal<AddRoleSelection> = signal<AddRoleSelection>({
    orgRoles: [],
    spaceRolesBySpace: {},
  });

  protected submitting: WritableSignal<boolean> = signal<boolean>(false);

  // ── Computed signals ──────────────────────────────────────────────────────

  /** Invite tab is absent (not disabled) when the feature is not available. */
  protected inviteTabVisible: Signal<boolean> = computed(() => this.data.userInviteAllowed === true);

  /** Org picker is locked when opened from an org or space page. */
  protected orgLocked: Signal<boolean> = computed(() => !!this.data.orgGuid);

  /** Space picker is locked when opened from a space page. */
  protected spaceLocked: Signal<boolean> = computed(() => !!this.data.spaceGuid);

  /**
   * Submit is enabled once at least one valid identity is entered.
   * Roles are optional — role selection does NOT gate submission.
   */
  protected canSubmit: Signal<boolean> = computed(
    () => this.identitiesValid() && this.identities().length > 0 && !this.submitting(),
  );

  // ── StackedInputActions wiring ────────────────────────────────────────────

  protected stackedActionConfig: StackedInputActionConfig = {
    isEmailInput: false,
    text: {
      placeholder: 'Username',
      requiredError: 'Username is required',
      uniqueError: 'Username is not unique',
    },
  };

  protected stateIn: WritableSignal<StackedInputActionsState[]> = signal<StackedInputActionsState[]>([]);
  protected stateIn$: Observable<StackedInputActionsState[]> = toObservable(this.stateIn);

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor() {
    // Load identity-provider origins for the combobox. Degrade gracefully on
    // error or when the service returns no providers (free-text entry stays
    // available because the combobox is always editable).
    //
    // Subscribe (not firstValueFrom) so that synchronous observables (e.g.
    // `of()` in tests) populate the signal immediately without a microtask gap.
    this.idps.listOrigins(this.data.cfGuid).subscribe({
      next: origins => this.originOptions.set(origins),
      error: () => undefined,
    });
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  /** Receives stateOut from StackedInputActionsComponent. */
  protected onIdentities(update: StackedInputActionsUpdate): void {
    this.identities.set(Object.values(update.values).filter(Boolean));
    this.identitiesValid.set(update.valid);
  }

  protected switchMode(mode: AddMode): void {
    this.mode.set(mode);
    // Adapt the stacked-input placeholder to the current mode.
    this.stackedActionConfig = {
      isEmailInput: mode === 'invite',
      text: {
        placeholder: mode === 'invite' ? 'Email address' : 'Username',
        requiredError: mode === 'invite' ? 'Email is required' : 'Username is required',
        uniqueError: mode === 'invite' ? 'Email is not unique' : 'Username is not unique',
      },
    };
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);
    try {
      // The orchestrator (addUsers from cf-users-add.ts) is called by the
      // opener after the dialog closes with `true`. The dialog itself does
      // not hold AddUsersDeps injections — it returns the collected inputs
      // via close() so the opener can wire the deps from its own injector.
      //
      // NOTE: Phase 4 will swap this for a full orchestrator call once the
      // opener (action-bar handlers) is wired. For now we close with `true`
      // to signal full success.
      this.dialogRef.close(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
