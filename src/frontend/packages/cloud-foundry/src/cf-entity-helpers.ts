import { EntityCatalogueHelpers } from '../../core/src/core/entity-catalogue/entity-catalogue.helper';
import { CF_ENDPOINT_TYPE } from '../cf-types';

export function getCFEntityKey(type: string) {
  return EntityCatalogueHelpers.buildEntityKey(type, CF_ENDPOINT_TYPE);
}
