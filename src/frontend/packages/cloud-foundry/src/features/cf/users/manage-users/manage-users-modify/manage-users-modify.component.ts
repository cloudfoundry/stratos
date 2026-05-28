import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ComponentRef, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { take,
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  defaultIfEmpty,
  map,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import {
  TailwindSnackBarService,
  TailwindSnackBarRef,
  ITableListDataSource,
  ITableColumn,
  EnumerateComponent,
  TableComponent,
} from '@stratosui/core';
import { getRowMetadata, APIResource } from '@stratosui/store';
import { IOrganization } from '../../../../../cf-api.types';
import {
  TableCellRoleOrgSpaceComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { CfUser, OrgUserRoleNames } from '../../../../../store/types/cf-user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';

interface Org { metadata: { guid: string, }; }
interface CfUserWithWarning extends CfUser {
  showWarning: boolean;
}

@Component({
  selector: 'app-manage-users-modify',
  templateUrl: './manage-users-modify.component.html',
  styleUrls: ['./manage-users-modify.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    EnumerateComponent,
    TableComponent,
  ]
})
export class UsersRolesModifyComponent implements OnInit, OnDestroy {
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfRolesService = inject(CfRolesService);
  private cd = inject(ChangeDetectorRef);
  private snackBar = inject(TailwindSnackBarService);
  private rolesData = inject(CfUsersRolesDataService);
  // Cache the rxjs bridges in the constructor so handlers and ngOnInit
  // can reuse them without needing the injection context that toObservable
  // requires. orgGuid$/picked$/newRoles$/isRemove$ are stable per service
  // instance and emit synchronously through the underlying signal.
  private orgGuid$ = toObservable(this.rolesData.orgGuid);
  private picked$ = toObservable(this.rolesData.users);
  private newRoles$ = toObservable(this.rolesData.newRoles);
  private isRemove$$ = toObservable(this.rolesData.isRemove);
  private isSetByUsername$$ = toObservable(this.rolesData.isSetByUsername);



  @Input() setUsernames = false;
  orgColumns: ITableColumn<Org>[] = [
    {
      columnId: 'org',
      headerCell: () => 'Organization',
      cellComponent: TableCellSelectOrgComponent
    },
    {
      columnId: 'manager',
      headerCell: () => 'Manager',
      cellComponent: TableCellRoleOrgSpaceComponent,
      class: 'app-table__cell--table-column-additional-padding',
      cellConfig: {
        role: OrgUserRoleNames.MANAGER
      }
    },
    {
      columnId: 'auditor',
      headerCell: () => 'Auditor',
      cellComponent: TableCellRoleOrgSpaceComponent,
      class: 'app-table__cell--table-column-additional-padding',
      cellConfig: {
        role: OrgUserRoleNames.AUDITOR
      }
    },
    {
      columnId: 'billingManager',
      headerCell: () => 'Billing Manager',
      cellComponent: TableCellRoleOrgSpaceComponent,
      class: 'app-table__cell--table-column-additional-padding',
      cellConfig: {
        role: OrgUserRoleNames.BILLING_MANAGERS
      }
    },
    {
      columnId: 'user',
      headerCell: () => 'User',
      cellComponent: TableCellRoleOrgSpaceComponent,
      class: 'app-table__cell--table-column-additional-padding',
      cellConfig: {
        role: OrgUserRoleNames.USER
      }
    }
  ];
  orgDataSource!: ITableListDataSource<APIResource<IOrganization>>;

  @ViewChild('spaceRolesTable', { read: ViewContainerRef, static: true })
  spaceRolesTable!: ViewContainerRef;

  private wrapperRef: ComponentRef<SpaceRolesListWrapperComponent>;
  private snackBarRef: TailwindSnackBarRef<any>;

  usersNames$!: Observable<string[]>;
  blocked = signal<boolean>(true);
  blocked$: Observable<boolean> = toObservable(this.blocked).pipe(delay(0));
  valid$!: Observable<boolean>;
  orgRoles = OrgUserRoleNames;
  selectedOrgGuid!: string;
  orgGuidChangedSub!: Subscription;
  usersWithWarning$!: Observable<string[]>;
  isSetByUsername$!: Observable<boolean | undefined>;
  isRemove$!: Observable<boolean | undefined>;

  ngOnInit() {
    if (this.setUsernames) {
      this.blocked.set(false);
    } else {
      this.cfRolesService.loading$.subscribe(loading => this.blocked.set(loading));
    }

    const orgEntity$ = this.orgGuid$.pipe(
      startWith(''),
      distinctUntilChanged(),
      filter(orgGuid => !!orgGuid),
      tap(orgGuid => this.updateOrg(orgGuid)),
      switchMap(orgGuid => this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, orgGuid)),
      share()
    );

    const orgConnect$ = orgEntity$.pipe(
      filter(entityInfo => !!entityInfo.entity),
      map(entityInfo => [entityInfo.entity]),
      share()
    );

    const isTableLoading$ = orgEntity$.pipe(
      map(orgEntity => orgEntity.entityRequestInfo.fetching),
      startWith(true)
    );
    // Data source that will power the orgs table
    this.orgDataSource = {
      isTableLoading$,
      connect: () => orgConnect$,
      disconnect: () => { },
      trackBy: (index, row) => getRowMetadata(row)
    } as ITableListDataSource<APIResource<IOrganization>>;

    // Set the starting state of the org table
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid).pipe(
        take(1),
        defaultIfEmpty(null)
      ).subscribe(org => {
        if (org) { this.rolesData.setOrg(this.activeRouteCfOrgSpace.orgGuid, org.entity.entity.name); }
      });
    } else {
      this.orgGuidChangedSub = this.cfRolesService.fetchOrgs(this.activeRouteCfOrgSpace.cfGuid).pipe(
        filter(orgs => orgs && !!orgs.length),
        take(1)
      ).subscribe(orgs => {
        if (orgs[0]?.metadata?.guid && orgs[0]?.entity?.name) {
          this.rolesData.setOrg(orgs[0].metadata.guid, orgs[0].entity.name);
        }
      });
    }

    const users$: Observable<CfUserWithWarning[]> = this.picked$.pipe(
      filter(users => !!users),
      distinctUntilChanged(),
      map(users => users.map(this.mapUser.bind(this)))
    );

    this.usersNames$ = users$.pipe(
      map(users => users.map(user => user.showWarning ? '*' + user.username : user.username))
    );

    this.usersWithWarning$ = users$.pipe(
      map(users => users.filter(user => !!user.showWarning).map(user => user.username))
    );

    this.valid$ = this.newRoles$.pipe(
      debounceTime(150),
      switchMap(newRoles => this.cfRolesService.createRolesDiff(newRoles?.orgGuid)),
      map(changes => !!changes.length)
    );

    this.isSetByUsername$ = this.isSetByUsername$$;
    this.isRemove$ = this.isRemove$$;
  }

  private mapUser(user: CfUser): CfUserWithWarning {
    // If we're at the org level or lower we guarantee org roles. If we're at the space we guarantee space roles.

    const showWarning = !!user.missingRoles &&
      ((user.missingRoles.org.length && !this.activeRouteCfOrgSpace.orgGuid) ||
        (user.missingRoles.space.length && !this.activeRouteCfOrgSpace.spaceGuid));
    // Ensure we're in an object where the username is always populated (in some cases it's missing)
    const newUser = {
      ...user,
      showWarning,
      username: user.username || user.guid
    };
    return newUser;
  }

  private destroySpacesList() {
    if (this.wrapperRef) {
      this.wrapperRef.destroy();
    }
    if (this.spaceRolesTable) {
      this.spaceRolesTable.clear();
    }
  }

  ngOnDestroy() {
    if (this.orgGuidChangedSub) {
      this.orgGuidChangedSub.unsubscribe();
    }
    this.destroySpacesList();
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  updateOrg(orgGuid: string) {
    this.selectedOrgGuid = orgGuid;
    if (!this.selectedOrgGuid) {
      return;
    }

    // When the state is ready (org guid is correct), recreate the space roles table for the selected org
    this.newRoles$.pipe(
      // Wait for the store to have the correct org
      filter(newRoles => !!newRoles && newRoles.orgGuid === orgGuid),
      take(1)
    ).subscribe({
      complete: () => {
        // The org has changed, completely recreate the roles table
        this.destroySpacesList();

        this.wrapperRef = this.spaceRolesTable.createComponent(SpaceRolesListWrapperComponent);
        this.cd.detectChanges();
      }
    });
  }

  onEnter = () => {
    if (!this.snackBarRef) {
      this.usersWithWarning$.pipe(take(1)).subscribe((usersWithWarning => {
        if (usersWithWarning && usersWithWarning.length) {
          this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
          navigate to a specific organization or space`, 'Dismiss');
        }
      }));
    }

    // In order to show the removed roles correctly (as ticks) flip them from remove to add
    this.isRemove$$.pipe(take(1)).subscribe(isRemove => {
      if (isRemove) {
        this.rolesData.flipSetRoles();
      }
    });
  };

  onLeave = (isNext: boolean) => {
    if (!isNext && this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  };

  onNext = () => {
    return combineLatest([
      this.isRemove$$.pipe(take(1)),
      this.cfRolesService.createRolesDiff(this.selectedOrgGuid)
    ]).pipe(
      map(([isRemove]) => {
        if (isRemove) {
          // If we're going to eventually remove the roles flip the add to remove
          this.rolesData.flipSetRoles();
        }
        return { success: true };
      })
    ).pipe(catchError(_err => {
      return observableOf({ success: false });
    }));
  };

}
