import { schema } from 'normalizr';

export class ComponentEntityMonitorConfig {
  constructor(public guid: string, public schema: schema.Entity) { }
}
