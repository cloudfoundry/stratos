import {
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  first,
  map,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import {
  ITableListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  selectUsersIsRemove,
  selectUsersIsSetByUsername,
  selectUsersRolesOrgGuid,
  selectUsersRolesPicked,
  selectUsersRolesRoles,
} from '../../../../../../../store/src/selectors/users-roles.selector';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { UsersRolesFlipSetRoles, UsersRolesSetOrg } from '../../../../../actions/users-roles.actions';
import { IOrganization } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import {
  TableCellRoleOrgSpaceComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import { CfUser, OrgUserRoleNames } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';

/* tslint:disable:max-line-length */

/* tslint:enable:max-line-length */

interface Org { metadata: { guid: string }; }
interface CfUserWithWarning extends CfUser {
  showWarning: boolean;
}

@Component({
  selector: 'app-manage-users-modify',
  templateUrl: './manage-users-modify.component.html',
  styleUrls: ['./manage-users-modify.component.scss'],
  entryComponents: [SpaceRolesListWrapperComponent]
})
export class UsersRolesModifyComponent implements OnInit, OnDestroy {


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
  orgDataSource: ITableListDataSource<APIResource<IOrganization>>;

  @ViewChild('spaceRolesTable', { read: ViewContainerRef, static: true })
  spaceRolesTable: ViewContainerRef;

  private wrapperFactory: ComponentFactory<SpaceRolesListWrapperComponent>;
  private wrapperRef: ComponentRef<SpaceRolesListWrapperComponent>;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  usersNames$: Observable<string[]>;
  blocked = new BehaviorSubject<boolean>(true);
  blocked$: Observable<boolean> = this.blocked.asObservable().pipe(delay(0));
  valid$: Observable<boolean>;
  orgRoles = OrgUserRoleNames;
  selectedOrgGuid: string;
  orgGuidChangedSub: Subscription;
  usersWithWarning$: Observable<string[]>;
  isSetByUsername$: Observable<boolean>;
  isRemove$: Observable<boolean>;

  constructor(
    private store: Store<CFAppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cfRolesService: CfRolesService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
  ) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(SpaceRolesListWrapperComponent);
  }

  ngOnInit() {
    if (this.setUsernames) {
      this.blocked.next(false);
    } else {
      this.cfRolesService.loading$.subscribe(loading => this.blocked.next(loading));
    }

    const orgEntity$ = this.store.select(selectUsersRolesOrgGuid).pipe(
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
        first()
      ).subscribe(org => {
        this.store.dispatch(new UsersRolesSetOrg(this.activeRouteCfOrgSpace.orgGuid, org.entity.entity.name));
      });
    } else {
      this.orgGuidChangedSub = this.cfRolesService.fetchOrgs(this.activeRouteCfOrgSpace.cfGuid).pipe(
        filter(orgs => orgs && !!orgs.length),
        first()
      ).subscribe(orgs => {
        this.store.dispatch(new UsersRolesSetOrg(orgs[0].metadata.guid, orgs[0].entity.name));
      });
    }

    const users$: Observable<CfUserWithWarning[]> = this.store.select(selectUsersRolesPicked).pipe(
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

    this.valid$ = this.store.select(selectUsersRolesRoles).pipe(
      debounceTime(150),
      switchMap(newRoles => this.cfRolesService.createRolesDiff(newRoles.orgGuid)),
      map(changes => !!changes.length)
    );

    this.isSetByUsername$ = this.store.select(selectUsersIsSetByUsername);
    this.isRemove$ = this.store.select(selectUsersIsRemove);
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
    this.store.select(selectUsersRolesRoles).pipe(
      // Wait for the store to have the correct org
      filter(newRoles => newRoles && newRoles.orgGuid === orgGuid),
      first()
    ).subscribe({
      complete: () => {
        // The org has changed, completely recreate the roles table
        this.destroySpacesList();

        this.wrapperRef = this.spaceRolesTable.createComponent(this.wrapperFactory);
        this.cd.detectChanges();
      }
    });
  }

  onEnter = () => {
    if (!this.snackBarRef) {
      this.usersWithWarning$.pipe(first()).subscribe((usersWithWarning => {
        if (usersWithWarning && usersWithWarning.length) {
          this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
          navigate to a specific organization or space`, 'Dismiss');
        }
      }));
    }

    // In order to show the removed roles correctly (as ticks) flip them from remove to add
    this.store.select(selectUsersIsRemove).pipe(first()).subscribe(isRemove => {
      if (isRemove) {
        this.store.dispatch(new UsersRolesFlipSetRoles());
      }
    });
  }

  onLeave = (isNext: boolean) => {
    if (!isNext && this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  onNext = () => {
    return combineLatest([
      this.store.select(selectUsersIsRemove).pipe(first()),
      this.cfRolesService.createRolesDiff(this.selectedOrgGuid)
    ]).pipe(
      map(([isRemove,]) => {
        if (isRemove) {
          // If we're going to eventually remove the roles flip the add to remove
          this.store.dispatch(new UsersRolesFlipSetRoles());
        }
        return { success: true };
      })
    ).pipe(catchError(err => {
      return observableOf({ success: false });
    }));
  }

}
