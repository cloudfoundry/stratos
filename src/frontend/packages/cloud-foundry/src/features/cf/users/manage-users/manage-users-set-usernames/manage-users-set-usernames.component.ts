import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, of } from 'rxjs';
import { take, defaultIfEmpty, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import {
  CustomFormFieldComponent,
  PermissionConfig,
  CurrentUserPermissionsService,
  StackedInputActionConfig,
  StackedInputActionsComponent,
  StackedInputActionsState,
  StackedInputActionsUpdate,
  StepOnNextFunction,
} from '@stratosui/core';
import { CFFeatureFlagTypes } from '../../../../../cf-api.types';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { CfCurrentUserRolesSignalService } from '../../../../../user-permissions/cf-current-user-roles-signal.service';
import { CfPermissionTypes } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { waitForCFPermissions } from '../../../cf.helpers';

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
    CustomFormFieldComponent,
    StackedInputActionsComponent
  ]
})
export class ManageUsersSetUsernamesComponent implements OnInit {
  private rolesData = inject(CfUsersRolesDataService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);


  public stepValid = signal<boolean>(false);
  public valid$: Observable<boolean> = toObservable(this.stepValid);
  private usernames!: StackedInputActionsUpdate;
  public origin!: string;
  public canAdd$: Observable<boolean>;
  public canRemove$: Observable<boolean>;
  public blocked$: Observable<boolean>;
  public currentValue!: boolean;

  public stackedActionConfig: StackedInputActionConfig = {
    isEmailInput: false,
    text: {
      placeholder: 'Username',
      requiredError: 'Username is required',
      uniqueError: 'Username is not unique'
    }
  };

  public stateIn = signal<StackedInputActionsState[]>([]);
  public stateIn$: Observable<StackedInputActionsState[]>;

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;
    const cfRoles = inject(CfCurrentUserRolesSignalService);
    const userPerms = inject(CurrentUserPermissionsService);

    this.stateIn$ = toObservable(this.stateIn);
    const ffSetPermConfig = new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.set_roles_by_username);
    const ffRemovePermConfig = new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.unset_roles_by_username);
    this.canAdd$ = waitForCFPermissions(cfRoles, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => userPerms.can(ffSetPermConfig, activeRouteCfOrgSpace.cfGuid)),
      take(1),
      publishReplay(1),
      refCount()
    );
    this.canRemove$ = waitForCFPermissions(cfRoles, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => userPerms.can(ffRemovePermConfig, activeRouteCfOrgSpace.cfGuid)),
      take(1),
      publishReplay(1),
      refCount()
    );

    const canAddRemove = combineLatest([this.canAdd$, this.canRemove$]);

    // Set starting value of add/remove radio button
    canAddRemove.pipe(take(1), defaultIfEmpty([false, false] as [boolean, boolean])).subscribe(([canAdd]) => this.setIsRemove({ source: null, value: !canAdd }));

    // Block content until we know the add/remove state
    this.blocked$ = canAddRemove.pipe(
      map(() => false),
      take(1),
      startWith(true),
      publishReplay(1),
      refCount(),
    );

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
    this.currentValue = event.value;
  }

  onNext: StepOnNextFunction = () => {
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
    return of({
      success: true
    });
  };
}
