import { schema as normalizrSchema} from 'normalizr';

export class ComponentEntityMonitorConfig {
  constructor(public guid: string, public schema: normalizrSchema.Entity) { }
}
