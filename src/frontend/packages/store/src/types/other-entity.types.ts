import { systemStoreNames } from './system.types';
import { endpointStoreNames } from './endpoint.types';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { endpointSchemaKey } from '../helpers/entity-factory';

export interface OtherEntitiesState {
  endpoint: any;
}
const endpointEntityKey = entityCatalogue.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointSchemaKey);

// TODO: What is this for? - nj
export const OtherEntityStateNames = [
  endpointEntityKey,
  systemStoreNames.type
];
