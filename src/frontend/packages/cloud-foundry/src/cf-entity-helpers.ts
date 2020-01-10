import { EntityCatalogHelpers } from '../../store/src/entity-catalog/entity-catalog.helper';
import { CF_ENDPOINT_TYPE } from './cf-types';

export function getCFEntityKey(type: string) {
  return EntityCatalogHelpers.buildEntityKey(type, CF_ENDPOINT_TYPE);
}
