import { schema as normalizrSchema } from 'normalizr';
import { AppState } from '../../../store/src/app-state';
export class ComponentEntityMonitorConfig {
  constructor(public guid: string, public schema: normalizrSchema.Entity) { }
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

export type PartialAppState = Partial<AppState>;

export type PickAppState = keyof AppState;

