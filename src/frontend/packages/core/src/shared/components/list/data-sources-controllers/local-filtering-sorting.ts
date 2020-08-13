import { MultiActionListEntity } from '../../../../../../store/src/monitors/pagination-monitor';
import { DataFunction, DataFunctionDefinition } from './list-data-source';

export function getDataFunctionList(entityFunctions: (DataFunction<any> | DataFunctionDefinition)[]): DataFunction<any>[] {
  return entityFunctions.map(functionOrDef => {
    const def = functionOrDef as DataFunctionDefinition;
    if (def.type) {
      switch (def.type) {
        case 'sort':
          return getSortFunction(def);
        case 'filter':
          return getFilterFunction(def);
      }
    }
    return functionOrDef as DataFunction<any>;
  });
}

function getFieldArray(def: DataFunctionDefinition) {
  return def.field.split('.');
}

function getFilterFunction(def: DataFunctionDefinition): DataFunction<any> {
  const fieldArray = getFieldArray(def);
  return (entities, paginationState) => {
    const upperCaseFilter = paginationState.clientPagination.filter.string.toUpperCase();
    if (!upperCaseFilter) {
      return entities;
    }
    return entities.filter(e => {
      e = extractActualListEntity(e);
      const value = getValue(e, fieldArray, 0, true);
      if (!value) {
        return false;
      }
      return value.toUpperCase().includes(upperCaseFilter);
    });
  };
}

function getSortFunction(def: DataFunctionDefinition): DataFunction<any> {
  const fieldArray = getFieldArray(def);
  return (entities, paginationState) => {
    const orderKey = paginationState.params['order-direction-field'];
    if (orderKey === def.orderKey) {
      const orderDirection = paginationState.params['order-direction'];
      if (!entities || !orderKey) {
        return entities;
      }

      return entities.sort((a, b) => {
        a = extractActualListEntity(a);
        b = extractActualListEntity(b);
        const valueA = checkAndUpperCase(getValue(a, fieldArray));
        const valueB = checkAndUpperCase(getValue(b, fieldArray));
        if (valueA > valueB) {
          return orderDirection === 'desc' ? 1 : -1;
        }
        if (valueA < valueB) {
          return orderDirection === 'desc' ? -1 : 1;
        }
        return 0;
      });
    } else {
      return entities;
    }
  };
}

/**
 * Standard sort function for sorting integer field
 */
export function getIntegerFieldSortFunction(field: string): DataFunction<any> {
  const fieldArray = field.split('.');
  return (entities, paginationState) => {
    const orderDirection = paginationState.params['order-direction'] || 'asc';
    return entities.sort((a, b) => {
      a = extractActualListEntity(a);
      b = extractActualListEntity(b);
      const valueA = parseInt(getValue(a, fieldArray), 10);
      const valueB = parseInt(getValue(b, fieldArray), 10);
      if (valueA > valueB) {
        return orderDirection === 'desc' ? 1 : -1;
      }
      if (valueA < valueB) {
        return orderDirection === 'desc' ? -1 : 1;
      }
      return 0;
    });
  };
}

function checkAndUpperCase(value: any) {
  if (typeof value.toUpperCase === 'function') {
    value = value.toUpperCase();
  }
  return value;
}

function getValue(obj, fieldArray: string[], index = 0, castToString = false): string {
  const field = fieldArray[index];
  if (!field) {
    if (castToString) {
      return obj + '';
    }
    return obj;
  }
  if (!obj[field]) {
    return '';
  }
  return getValue(obj[field], fieldArray, ++index);
}

export function extractActualListEntity(entity: any | MultiActionListEntity) {
  if (entity instanceof MultiActionListEntity) {
    return entity.entity;
  }
  return entity;
}
