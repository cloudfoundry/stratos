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
import { CfRolesService } from '../manage-users/cf-roles.service';
import { CfUsersRolesDataService } from '../../../../services/domain-data/cf-users-roles-data.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { TailwindSnackBarService } from '@stratosui/core';
import { CfUsersPagedDataService } from '../../../../shared/data-services/cf-users-paged-data.service';
import { CnsiUsersSnapshotService } from '../../../../services/endpoint-data/cnsi-users-snapshot.service';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../../store/types/cf-user.types';
import {
  AddMode,
  AddRoleSelection,
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
  ],
})
export class AddUserDialogComponent {
  private dialogRef = inject<TailwindDialogRef<AddUserDialogComponent, boolean>>(TailwindDialogRef);

  /** Injected dialog data — accessed in spec via `cmp.data` (protected). */
  protected data = inject<AddUserDialogData>(MAT_DIALOG_DATA);

  private idps = inject(CfIdentityProvidersService);
  private rolesService = inject(CfRolesService);

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

  /** Optional role selection — roles are not required for submission. */
  protected selection: WritableSignal<AddRoleSelection> = signal<AddRoleSelection>({
    orgRoles: [],
    spaceRolesBySpace: {},
  });

  protected submitting: WritableSignal<boolean> = signal<boolean>(false);

  // ── Role-picker scope state ───────────────────────────────────────────────
  //
  // SEPARATE sub-section (see template "Scope & roles" block) so Phase 4's D7
  // multi-org widget can replace just this scope+roles unit. Sourced from
  // CfRolesService (permission-filtered orgs; native spaces-by-org), NOT the
  // wizard-coupled manage-users-modify matrix — plain checkboxes write the
  // AddRoleSelection into `selection` directly.

  /** Permission-filtered orgs for the CF-level org dropdown. */
  protected orgOptions: WritableSignal<{ guid: string; name: string }[]> = signal<{ guid: string; name: string }[]>([]);

  /** Chosen org guid — initialised from locked data.orgGuid when present. */
  protected chosenOrgGuid: WritableSignal<string> = signal<string>(this.data.orgGuid ?? '');

  /** Spaces of the chosen org (or just the locked space on a space page). */
  protected spaceOptions: WritableSignal<{ guid: string; name: string }[]> = signal<{ guid: string; name: string }[]>([]);

  /** The four org-role checkboxes (label + CF role name). */
  protected readonly orgRoleDefs: { name: OrgUserRoleNames; label: string }[] = [
    { name: OrgUserRoleNames.MANAGER, label: 'Manager' },
    { name: OrgUserRoleNames.AUDITOR, label: 'Auditor' },
    { name: OrgUserRoleNames.BILLING_MANAGERS, label: 'Billing Manager' },
    { name: OrgUserRoleNames.USER, label: 'User' },
  ];

  /** The three space-role checkboxes (label + CF role name). */
  protected readonly spaceRoleDefs: { name: SpaceUserRoleNames; label: string }[] = [
    { name: SpaceUserRoleNames.MANAGER, label: 'Manager' },
    { name: SpaceUserRoleNames.AUDITOR, label: 'Auditor' },
    { name: SpaceUserRoleNames.DEVELOPER, label: 'Developer' },
  ];

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

    // Role-picker scope. When org/space is locked (org or space page) the org
    // dropdown is suppressed and we go straight to that org's spaces. Otherwise
    // load the permission-filtered org list for the CF-level dropdown.
    if (this.orgLocked()) {
      this.loadSpaces(this.chosenOrgGuid());
    } else {
      this.rolesService.fetchOrgs(this.data.cfGuid).subscribe({
        next: orgs => this.orgOptions.set(orgs.map(o => ({ guid: o.metadata.guid, name: o.entity.name }))),
        error: () => undefined,
      });
    }
  }

  /** Load the chosen org's spaces, restricting to the locked space if set. */
  private loadSpaces(orgGuid: string): void {
    if (!orgGuid) {
      this.spaceOptions.set([]);
      return;
    }
    this.rolesService.fetchSpacesForOrg(this.data.cfGuid, orgGuid).subscribe({
      next: spaces => {
        const filtered = this.spaceLocked()
          ? spaces.filter(s => s.guid === this.data.spaceGuid)
          : spaces;
        this.spaceOptions.set(filtered);
      },
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

  // ── Role-picker handlers ──────────────────────────────────────────────────

  /** Org dropdown change (CF-level only — locked orgs never reach here). */
  protected onOrgChange(orgGuid: string): void {
    this.chosenOrgGuid.set(orgGuid);
    // Changing org invalidates any per-space selections.
    this.selection.update(s => ({ ...s, spaceRolesBySpace: {} }));
    this.loadSpaces(orgGuid);
  }

  protected isOrgRoleSelected(role: OrgUserRoleNames): boolean {
    return this.selection().orgRoles.includes(role);
  }

  protected toggleOrgRole(role: OrgUserRoleNames, checked: boolean): void {
    this.selection.update(s => {
      const set = new Set(s.orgRoles);
      checked ? set.add(role) : set.delete(role);
      return { ...s, orgRoles: Array.from(set) };
    });
  }

  protected isSpaceRoleSelected(spaceGuid: string, role: SpaceUserRoleNames): boolean {
    return (this.selection().spaceRolesBySpace[spaceGuid] ?? []).includes(role);
  }

  protected toggleSpaceRole(spaceGuid: string, role: SpaceUserRoleNames, checked: boolean): void {
    this.selection.update(s => {
      const set = new Set(s.spaceRolesBySpace[spaceGuid] ?? []);
      checked ? set.add(role) : set.delete(role);
      const next = { ...s.spaceRolesBySpace };
      const roles = Array.from(set);
      if (roles.length > 0) {
        next[spaceGuid] = roles;
      } else {
        delete next[spaceGuid];
      }
      return { ...s, spaceRolesBySpace: next };
    });
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
    const orgGuid = this.chosenOrgGuid();
    const orgName = this.orgLocked()
      ? (this.data.orgName ?? '')
      : (this.orgOptions().find(o => o.guid === orgGuid)?.name ?? '');
    const spaceNameByGuid = new Map(this.spaceOptions().map(s => [s.guid, s.name]));
    return {
      mode: this.mode(),
      identities: this.identities(),
      origin: this.origin(),
      orgGuid,
      orgName,
      spaceNameByGuid,
      selection: this.selection(),
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
