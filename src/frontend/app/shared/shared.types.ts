import { schema as normalizrSchema } from 'normalizr';

export class ComponentEntityMonitorConfig {
  constructor(public guid: string, public schema: normalizrSchema.Entity) { }
}

export enum CardStatus {
  NONE = 'none',
  OK = 'ok',
  WARNING = 'warning',
  TENTATIVE = 'tentative',
  INCOMPLETE = 'incomplete',
  ERROR = 'error',
  BUSY = 'busy'
}
