import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Signal, signal, computed, effect, untracked, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AppInputDirective,
  CustomFormFieldComponent,
  PermissionConfig,
  CurrentUserPermissionsService,
  StackedInputActionConfig,
  StackedInputActionsComponent,
  StackedInputActionsState,
  StackedInputActionsUpdate,
  StepOnNextResult,
} from '@stratosui/core';
import { CFFeatureFlagTypes } from '../../../../../cf-api.types';
import { CfCurrentUserRolesDataService } from '../../../../../services/cf-current-user-roles-data.service';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { CfPermissionTypes } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { getFeatureFlagsSource } from '../../../../../user-permissions/feature-flags-cache';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';

export class ManageUsersSetUsernamesHelper {
  static createGuid(username: string, cfGuid: string, orgGuid: string): string {
    return `${username}/${cfGuid}/${orgGuid}`;
  }

  static usernameFromGuid(guid: string): string {
    const endOfUsername = guid.lastIndexOf('/', guid.lastIndexOf('/') - 1);
    return guid.substring(0, endOfUsername);
  }
}

@Component({
  selector: 'app-manage-users-set-usernames',
  templateUrl: './manage-users-set-usernames.component.html',
  styleUrls: ['./manage-users-set-usernames.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    StackedInputActionsComponent
  ]
})
export class ManageUsersSetUsernamesComponent implements OnInit {
  private rolesData = inject(CfUsersRolesDataService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);


  public stepValid = signal<boolean>(false);
  private usernames!: StackedInputActionsUpdate;
  public origin!: string;
  public readonly canAdd: Signal<boolean>;
  public readonly canRemove: Signal<boolean>;
  /** True until the roles and the feature flags the add/remove choice depends on have loaded. */
  public readonly blocked: Signal<boolean>;
  /** The add/remove choice: true removes roles; undefined until it is first set. */
  public readonly currentValue = signal<boolean | undefined>(undefined);

  public stackedActionConfig: StackedInputActionConfig = {
    isEmailInput: false,
    text: {
      placeholder: 'Username',
      requiredError: 'Username is required',
      uniqueError: 'Username is not unique'
    }
  };

  public stateIn = signal<StackedInputActionsState[]>([]);

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;
    const rolesData = inject(CfCurrentUserRolesDataService);
    const userPerms = inject(CurrentUserPermissionsService);
    const http = inject(HttpClient);

    const ffSetPermConfig = new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.set_roles_by_username);
    const ffRemovePermConfig = new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.unset_roles_by_username);
    const canSet = userPerms.can(ffSetPermConfig, activeRouteCfOrgSpace.cfGuid);
    const canUnset = userPerms.can(ffRemovePermConfig, activeRouteCfOrgSpace.cfGuid);
    this.canAdd = computed(() => canSet());
    this.canRemove = computed(() => canUnset());

    // The checks read false until the roles and the flags load, so the
    // choice is made, and the content shown, once both have.
    const flagsLoaded = signal(false);
    this.blocked = computed(() => !flagsLoaded());
    const rolesState = rolesData.cfEndpointRolesState(activeRouteCfOrgSpace.cfGuid);
    const loadFlags = effect(() => {
      if (!rolesState()?.state.initialised) {
        return;
      }
      untracked(() => {
        void getFeatureFlagsSource(activeRouteCfOrgSpace.cfGuid, http).load().then(() => {
          // Set starting value of add/remove radio button
          this.setIsRemove({ source: null, value: !canSet() });
          flagsLoaded.set(true);
        });
      });
      loadFlags.destroy();
    });
  }

  ngOnInit() {
    this.rolesData.setIsSetByUsername(true);
    // When we add username validation the processing state should be used to show validation progress and result
    const processingState: StackedInputActionsState[] = [];
    // Object.keys(this.users.values).forEach(key => {
    //   processingState.push({
    //     key,
    //     result: StackedInputActionResult.PROCESSING,
    //   });
    // });
    this.stateIn.set(processingState);
  }

  stateOut(usernames: StackedInputActionsUpdate) {
    this.usernames = usernames;
    this.stepValid.set(usernames.valid);
  }

  setIsRemove(event: {source: any, value: boolean}) {
    this.rolesData.setIsRemove(event.value);
    this.currentValue.set(event.value);
  }

  async onNext(): Promise<StepOnNextResult> {
    // Set-by-username seeds synthetic StUser rows: the username is the real
    // identity and `guid` is the composite (username/cfGuid/orgGuid) the
    // executeChanges payload keys off. There's no fetched CF user yet, so the
    // role buckets / metadata are empty placeholders.
    const users: StUser[] = Object.values(this.usernames.values).map(username => {
      return {
        username,
        guid: ManageUsersSetUsernamesHelper.createGuid(username, this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid),
        cnsiGuid: this.activeRouteCfOrgSpace.cfGuid,
        orgRoles: [],
        spaceRoles: [],
      } as StUser;
    });
    this.rolesData.setUsers(this.activeRouteCfOrgSpace.cfGuid, users, this.origin);
    return { success: true };
  }
}
