import { formatDistance } from 'date-fns';

import type { DataFunction, ITableColumn } from '@stratosui/core';
import type { BasicKubeAPIResource, ConditionType, KubernetesNode } from '../store/kube.types';

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
export function getContainerLengthSort(entities: BasicKubeAPIResource[], paginationState: { params: { 'order-direction'?: string } }): BasicKubeAPIResource[] {
  const orderDirection = paginationState.params['order-direction'] || 'asc';
  return entities.sort((a, b) => {

    const aConditionValue = (a.spec as { containers?: unknown[] }).containers?.length || 0;
    const bConditionValue = (b.spec as { containers?: unknown[] }).containers?.length || 0;
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
        return formatDistance(new Date(row.metadata.creationTimestamp), new Date());
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
