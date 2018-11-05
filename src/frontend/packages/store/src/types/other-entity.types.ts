import { systemStoreNames } from './system.types';
import { endpointStoreNames } from './endpoint.types';

export interface OtherEntitiesState {
  endpoint: any;
}
export const OtherEntityStateNames = [
  endpointStoreNames.type,
  systemStoreNames.type
];
