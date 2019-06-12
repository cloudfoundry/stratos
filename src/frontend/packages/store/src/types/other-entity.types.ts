import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { systemStoreNames } from './system.types';

export interface OtherEntitiesState {
  endpoint: any;
}
const endpointEntityKey = entityCatalogue.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointSchemaKey);

// TODO: What is this for? - nj
export const OtherEntityStateNames = [
  endpointEntityKey,
  systemStoreNames.type
];
