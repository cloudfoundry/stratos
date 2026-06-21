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
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { TailwindSnackBarService } from '@stratosui/core';
import { CfUsersPagedDataService } from '../../../../shared/data-services/cf-users-paged-data.service';
import { CnsiUsersSnapshotService } from '../../../../services/endpoint-data/cnsi-users-snapshot.service';
import { CfRoleChange } from '../../../../store/types/users-roles.types';
import { RoleAssignmentComponent } from '../../../../shared/components/role-assignment/role-assignment.component';
import {
  AddMode,
  AddUsersDeps,
  AddUsersRequest,
  addUsers,
} from '../../../../shared/signal-list-configs/user/cf-users-add';

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
    RoleAssignmentComponent,
  ],
})
export class AddUserDialogComponent {
  private dialogRef = inject<TailwindDialogRef<AddUserDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<AddUserDialogData>(MAT_DIALOG_DATA);

  private idps = inject(CfIdentityProvidersService);

  // Services assembled into AddUsersDeps for the orchestrator call in submit().
  private rolesData = inject(CfUsersRolesDataService);
  private invite = inject(UserInviteService);
  private snackBar = inject(TailwindSnackBarService);
  private paged = inject(CfUsersPagedDataService);
  private snapshot = inject(CnsiUsersSnapshotService);

  // ── Writable signals (field initializers — no `(this as {...})` casts) ────

  protected mode: WritableSignal<AddMode> = signal<AddMode>('associate');
  protected origin: WritableSignal<string> = signal<string>('uaa');
  protected originOptions: WritableSignal<string[]> = signal<string[]>([]);

  /** Values from StackedInputActionsComponent stateOut. */
  protected identities: WritableSignal<string[]> = signal<string[]>([]);
  protected identitiesValid: WritableSignal<boolean> = signal<boolean>(false);

  /** Role-grant changes from the RoleAssignmentComponent widget. */
  protected roleChanges: WritableSignal<CfRoleChange[]> = signal<CfRoleChange[]>([]);

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

  // I1: a WritableSignal (not a plain reassigned property) so OnPush re-renders
  // the StackedInputActionsComponent input when switchMode() changes the config.
  protected stackedActionConfig: WritableSignal<StackedInputActionConfig> = signal<StackedInputActionConfig>({
    isEmailInput: false,
    text: {
      placeholder: 'Username',
      requiredError: 'Username is required',
      uniqueError: 'Username is not unique',
    },
  });

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
    // Adapt the stacked-input placeholder to the current mode. .set() so the
    // OnPush child picks up the change (I1).
    this.stackedActionConfig.set({
      isEmailInput: mode === 'invite',
      text: {
        placeholder: mode === 'invite' ? 'Email address' : 'Username',
        requiredError: mode === 'invite' ? 'Email is required' : 'Username is required',
        uniqueError: mode === 'invite' ? 'Email is not unique' : 'Username is not unique',
      },
    });
  }

  /** Receives changeSet output from RoleAssignmentComponent. */
  protected onRoleChangeSet(changes: CfRoleChange[]): void {
    this.roleChanges.set(changes);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  // ── Request assembly + submit ─────────────────────────────────────────────

  private buildDeps(): AddUsersDeps {
    return {
      rolesData: this.rolesData,
      invite: this.invite,
      snackBar: this.snackBar,
      paged: this.paged,
      snapshot: this.snapshot,
      cfGuid: this.data.cfGuid,
    };
  }

  private buildRequest(): AddUsersRequest {
    return {
      mode: this.mode(),
      identities: this.identities(),
      origin: this.origin(),
      // orgGuid/orgName are used by addUsers for synthetic-user guid construction
      // and invite calls. They may be empty when no org is selected (CF-level with
      // no org chosen); the widget embeds org/space info in the changes themselves.
      orgGuid: this.data.orgGuid ?? '',
      orgName: this.data.orgName ?? '',
      // selection is kept as empty sentinel — addUsers will use req.changes instead.
      selection: { orgRoles: [], spaceRolesBySpace: {} },
      changes: this.roleChanges(),
    };
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);
    // addUsers never throws — it reports partial failures via snackbar and
    // returns a summary. Close on full success; stay open (re-enable submit)
    // on partial failure so the user can retry the failed identities.
    const r = await addUsers(this.buildDeps(), this.buildRequest());
    if (r.ok) {
      // M1: do NOT touch `submitting` after close() — the view is destroyed.
      this.dialogRef.close(true);
    } else {
      this.submitting.set(false);
    }
  }
}
