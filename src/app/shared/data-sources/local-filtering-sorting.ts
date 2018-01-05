import { DataFunction, DataFunctionDefinition } from './list-data-source-cf';
export function getDataFunctionList(entityFunctions: (DataFunction<any> | DataFunctionDefinition)[]) {
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
    return entities.filter(e => {
      const value = getValue(e, fieldArray);
      if (!value) {
        return false;
      }
      return value.includes(paginationState.clientPagination.filter);
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
        const valueA = getValue(a, fieldArray).toUpperCase();
        const valueB = getValue(b, fieldArray).toUpperCase();
        if (valueA > valueB) {
          return orderDirection === 'desc' ? -1 : 1;
        }
        if (valueA < valueB) {
          return orderDirection === 'desc' ? 1 : -1;
        }
        return 0;
      });
    } else {
      return entities;
    }
  };
}

function getValue(obj, fieldArray: string[], index = 0): string {
  const field = fieldArray[index];
  if (!field) {
    return obj + '';
  }
  if (typeof obj[field] === 'undefined') {
    return '';
  }
  return getValue(obj[field], fieldArray, ++index);
}
