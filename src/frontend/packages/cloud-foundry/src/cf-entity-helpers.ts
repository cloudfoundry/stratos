import { EntityCatalogueHelpers } from '../../store/src/entity-catalog/entity-catalogue.helper';
import { CF_ENDPOINT_TYPE } from '../cf-types';

export function getCFEntityKey(type: string) {
  return EntityCatalogueHelpers.buildEntityKey(type, CF_ENDPOINT_TYPE);
}
