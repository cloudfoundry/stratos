import * as moment from 'moment';

import { DataFunction } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { BasicKubeAPIResource, ConditionType, KubernetesNode } from '../store/kube.types';

export function getConditionSort(condition: ConditionType): DataFunction<KubernetesNode> {
  return (entities, paginationState) => {
    const orderDirection = paginationState.params['order-direction'] || 'asc';
    return entities.sort((a, b) => {

      const aConditionValue = a.status.conditions.find(c => c.type === condition);
      const bConditionValue = b.status.conditions.find(c => c.type === condition);
      if (aConditionValue > bConditionValue) {
        return orderDirection === 'desc' ? 1 : -1;
      }
      if (bConditionValue < aConditionValue) {
        return orderDirection === 'desc' ? -1 : 1;
      }
      return 0;
    });
  };
}
export function getContainerLengthSort(entities, paginationState) {
  const orderDirection = paginationState.params['order-direction'] || 'asc';
  return entities.sort((a, b) => {

    const aConditionValue = a.spec.containers.length;
    const bConditionValue = b.spec.containers.length;
    if (orderDirection === 'desc') {
      return aConditionValue - bConditionValue;
    } else {
      return bConditionValue - aConditionValue;
    }
  });
}

export function createKubeAgeColumn<T extends BasicKubeAPIResource>(): ITableColumn<T> {
  return {
    columnId: 'age',
    headerCell: () => 'Age',
    cellDefinition: {
      getValue: (row: T) => {
        return moment(row.metadata.creationTimestamp).fromNow(true);
      }
    },
    sort: {
      type: 'sort',
      orderKey: 'age',
      field: 'metadata.creationTimestamp'
    },
    cellFlex: '1'
  };
}
