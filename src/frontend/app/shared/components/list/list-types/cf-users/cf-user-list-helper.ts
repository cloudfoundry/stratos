import { distinctUntilChanged, switchMap } from 'rxjs/operators';

import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';

export function cfUserHasAllRoleProperties(user: APIResource<CfUser>): boolean {
  return !!user.entity.audited_organizations &&
    !!user.entity.billing_managed_organizations &&
    !!user.entity.managed_organizations &&
    !!user.entity.organizations &&
    !!user.entity.spaces &&
    !!user.entity.audited_spaces &&
    !!user.entity.managed_spaces;
}

export function cfUserRowStateSetUpManager(
  paginationMonitor: PaginationMonitor<APIResource<CfUser>>,
  entityMonitorFactory: EntityMonitorFactory,
  rowStateManager: TableRowStateManager,
  schemaKey: string
) {
  return paginationMonitor.currentPage$.pipe(
    distinctUntilChanged(),
    switchMap(entities => entities
      .map(entity => {
        const disabled = !cfUserHasAllRoleProperties(entity);
        rowStateManager.updateRowState(entity.entity.guid, {
          disabled,
          message: 'Not all roles can be fetched for this user. Please navigate to a space to see and update roles',
          error: disabled
        });
      })
    ),
  ).subscribe();
}
