import { AppState } from '../../../store/src/app-state';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';


export class ComponentEntityMonitorConfig {
  constructor(public guid: string, public schema: EntitySchema) { }
}

export enum StratosStatus {
  NONE = 'none',
  OK = 'ok',
  WARNING = 'warning',
  TENTATIVE = 'tentative',
  INCOMPLETE = 'incomplete',
  ERROR = 'error',
  BUSY = 'busy'
}

export interface StratosStatusMetadata {
  label: string;
  subLabel?: string;
  indicator: StratosStatus;
}

export type PartialAppState = Partial<AppState>;

export type PickAppState = keyof AppState;

