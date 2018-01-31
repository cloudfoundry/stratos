import { systemStoreNames } from './system.types';
import { cnsisStoreNames } from './cnsis.types';

export interface OtherEntitiesState {
  endpoint: any;
}
export const OtherEntityStateNames = [
  cnsisStoreNames.type,
  systemStoreNames.type
];
