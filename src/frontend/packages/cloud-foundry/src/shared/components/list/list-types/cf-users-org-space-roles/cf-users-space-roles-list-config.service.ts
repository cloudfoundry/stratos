import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, type Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type {
  CurrentUserPermissionsService,
} from '@stratosui/core';
import type { ITableColumn } from '@stratosui/core';
import { type IGlobalListAction, type IListAction, type IListConfig, type IListMultiFilterConfig, type IMultiListAction, ListViewTypes } from '@stratosui/core';
import type { ListView } from '../../../../../../../store/src/actions/list.actions';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { GeneralEntityAppState } from '@stratosui/store';
import type { ISpace } from '../../../../../cf-api.types';
import { selectCfUsersRolesRoles } from '../../../../../store/selectors/cf-users-roles.selector';
import { SpaceUserRoleNames } from '../../../../../store/types/cf-user.types';
import { CfUsersSpaceRolesDataSourceService } from './cf-users-space-roles-data-source.service';
import { TableCellRoleOrgSpaceComponent } from './table-cell-org-space-role/table-cell-org-space-role.component';


export class CfUsersSpaceRolesListConfigService implements IListConfig<APIResource<ISpace>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource!: CfUsersSpaceRolesDataSourceService;
  defaultView = 'table' as ListView;
  enableTextFilter = true;
  // This is a list of spaces and refresh will update the spaces rather than the roles as might have been expected. Until then disable
  hideRefresh = true;
  text = {
    title: null as string | null,
    filter: 'Search by name',
    noEntries: 'There are no spaces'
  };
  columns: ITableColumn<APIResource<ISpace>>[] = [{
    columnId: 'name',
    headerCell: () => 'Space',
    cellDefinition: {
      valuePath: 'entity.name'
    },
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'entity.name'
    }
  }, {
    columnId: 'manager',
    headerCell: () => 'Manager',
    cellComponent: TableCellRoleOrgSpaceComponent,
    class: 'app-table__cell--table-column-additional-padding',
    cellConfig: {
      role: SpaceUserRoleNames.MANAGER,
      isSpace: true
    }
  }, {
    columnId: 'auditor',
    headerCell: () => 'Auditor',
    cellComponent: TableCellRoleOrgSpaceComponent,
    class: 'app-table__cell--table-column-additional-padding',
    cellConfig: {
      role: SpaceUserRoleNames.AUDITOR,
      isSpace: true
    }
  }, {
    columnId: 'developer',
    headerCell: () => 'Developer',
    cellComponent: TableCellRoleOrgSpaceComponent,
    class: 'app-table__cell--table-column-additional-padding',
    cellConfig: {
      role: SpaceUserRoleNames.DEVELOPER,
      isSpace: true
    }
  }, {
    columnId: 'spacer',
    headerCell: () => '',
    cellDefinition: {
      getValue: (_row: APIResource<ISpace>) => ' '
    },
  }];
  // Use BehaviorSubject instead of signal + toObservable to avoid NG0203
  private initialised$ = new BehaviorSubject<boolean>(false);
  private store = inject(Store<GeneralEntityAppState>);

  constructor(cfGuid: string, spaceGuid: string, userPerms: CurrentUserPermissionsService) {
    this.store.select(selectCfUsersRolesRoles).pipe(
      first()
    ).subscribe(newRoles => {
      this.dataSource = new CfUsersSpaceRolesDataSourceService(cfGuid, newRoles.orgGuid, spaceGuid, this.store, userPerms, this);
      this.initialised$.next(true);
    });
  }

  getColumns = (): ITableColumn<APIResource<ISpace>>[] => this.columns;
  getGlobalActions = (): IGlobalListAction<APIResource<ISpace>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<ISpace>>[] => [];
  getSingleActions = (): IListAction<APIResource<ISpace>>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getDataSource = (): CfUsersSpaceRolesDataSourceService => this.dataSource;
  public getInitialised = (): Observable<boolean> => this.initialised$.asObservable();
}
