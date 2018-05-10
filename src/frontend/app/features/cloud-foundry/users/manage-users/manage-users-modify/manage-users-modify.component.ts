import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IOrganization } from '../../../../../core/cf-api.types';
import { ITableListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../shared/components/list/list-table/table.types';
import {
  TableCellRoleOrgSpaceComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import { UsersRolesSetOrg } from '../../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../../store/app-state';
import {
  selectUsersRolesOrgGuid,
  selectUsersRolesPicked,
  selectUsersRolesRoles,
} from '../../../../../store/selectors/users-roles.selector';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser, OrgUserRoleNames } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { getRowMetadata } from '../../../cf.helpers';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';


interface Org { metadata: { guid: string }; }

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

  users$: Observable<CfUser[]>;
  blocked$: Observable<boolean>;
  valid$: Observable<boolean>;
  orgRoles = OrgUserRoleNames;
  selectedOrgGuid: string;
  orgGuidChangedSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cfRolesService: CfRolesService) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(SpaceRolesListWrapperComponent);
  }

  ngOnInit() {
    // Data source that will power the orgs table
    this.orgDataSource = {
      connect: () => {
        return this.store.select(selectUsersRolesOrgGuid).pipe(
          filter(orgGuid => !!orgGuid),
          tap(orgGuid => this.updateOrg(orgGuid)),
          switchMap(orgGuid => this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, orgGuid)),
          map(org => [org]),
        );
      },
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

    this.users$ = this.store.select(selectUsersRolesPicked).pipe(
      distinctUntilChanged(),
    );

    this.valid$ = this.store.select(selectUsersRolesRoles).pipe(
      debounceTime(150),
      switchMap(newRoles => this.cfRolesService.createRolesDiff(newRoles.orgGuid)),
      map(changes => !!changes.length)
    );
  }

  ngOnDestroy(): void {
    if (this.orgGuidChangedSub) {
      this.orgGuidChangedSub.unsubscribe();
    }
  }

  updateOrg(orgGuid) {
    this.selectedOrgGuid = orgGuid;
    if (!orgGuid) {
      return;
    }

    this.store.select(selectUsersRolesRoles).pipe(
      filter(newRoles => newRoles && newRoles.orgGuid === orgGuid),
      first()
    ).subscribe(null, null, () => {
      // The org has changed, completely recreate the roles table
      if (this.wrapperRef) {
        this.wrapperRef.destroy();
      }
      if (this.spaceRolesTable) {
        this.spaceRolesTable.clear();
      }
      this.wrapperRef = this.spaceRolesTable.createComponent(this.wrapperFactory);
    });
  }

  onNext = () => {
    return this.cfRolesService.createRolesDiff(this.selectedOrgGuid).pipe(
      map(() => {
        return { success: true };
      })
    ).catch(err => {
      return Observable.of({ success: false });
    });
  }

}
