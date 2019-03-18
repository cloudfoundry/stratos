/* tslint:disable:max-line-length */
import {
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf, Subject, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import { UsersRolesSetOrg } from '../../../../../../../store/src/actions/users-roles.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  selectUsersRolesOrgGuid,
  selectUsersRolesPicked,
  selectUsersRolesRoles,
} from '../../../../../../../store/src/selectors/users-roles.selector';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CfUser, OrgUserRoleNames } from '../../../../../../../store/src/types/user.types';
import { IOrganization } from '../../../../../core/cf-api.types';
import { ITableListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../shared/components/list/list-table/table.types';
import {
  TableCellRoleOrgSpaceComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { getRowMetadata } from '../../../cf.helpers';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';

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
      cellConfig: {
        role: OrgUserRoleNames.MANAGER,
      }
    },
    {
      columnId: 'auditor',
      headerCell: () => 'Auditor',
      cellComponent: TableCellRoleOrgSpaceComponent,
      cellConfig: {
        role: OrgUserRoleNames.AUDITOR,
      }
    },
    {
      columnId: 'billingManager',
      headerCell: () => 'Billing Manager',
      cellComponent: TableCellRoleOrgSpaceComponent,
      cellConfig: {
        role: OrgUserRoleNames.BILLING_MANAGERS,
      }
    },
    {
      columnId: 'user',
      headerCell: () => 'User',
      cellComponent: TableCellRoleOrgSpaceComponent,
      cellConfig: {
        role: OrgUserRoleNames.USER,
      }
    }
  ];
  orgDataSource: ITableListDataSource<APIResource<IOrganization>>;

  @ViewChild('spaceRolesTable', { read: ViewContainerRef })
  spaceRolesTable: ViewContainerRef;

  private wrapperFactory: ComponentFactory<SpaceRolesListWrapperComponent>;
  private wrapperRef: ComponentRef<SpaceRolesListWrapperComponent>;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  usersNames$: Observable<string[]>;
  blocked$: Observable<boolean>;
  valid$: Observable<boolean>;
  orgRoles = OrgUserRoleNames;
  selectedOrgGuid: string;
  orgGuidChangedSub: Subscription;
  usersWithWarning$: Observable<string[]>;
  entered = new Subject<boolean>();

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cfRolesService: CfRolesService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
  ) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(SpaceRolesListWrapperComponent);
    this.blocked$ = combineLatest(this.entered.asObservable(), cfRolesService.loading$).pipe(
      map(([entered, loading]) => loading),
      startWith(false)
    );
  }

  ngOnInit() {
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
      this.store.dispatch(new UsersRolesSetOrg(this.activeRouteCfOrgSpace.orgGuid));
    } else {
      this.orgGuidChangedSub = this.cfRolesService.fetchOrgs(this.activeRouteCfOrgSpace.cfGuid).pipe(
        filter(orgs => orgs && !!orgs.length),
        first()
      ).subscribe(orgs => this.store.dispatch(new UsersRolesSetOrg(orgs[0].metadata.guid)));
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

  updateOrg(orgGuid) {
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
    this.entered.next(true);
    if (!this.snackBarRef) {
      this.usersWithWarning$.pipe(first()).subscribe((usersWithWarning => {
        if (usersWithWarning && usersWithWarning.length) {
          this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
          navigate to a specific organization or space`, 'Dismiss');
        }
      }));
    }
  }

  onLeave = (isNext: boolean) => {
    if (!isNext && this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  onNext = () => {
    return this.cfRolesService.createRolesDiff(this.selectedOrgGuid).pipe(
      map(() => {
        return { success: true };
      })
    ).pipe(catchError(err => {
      return observableOf({ success: false });
    }));
  }

}
