import { Injectable } from '@angular/core';
import { EntityMonitor } from './entity-monitor';
import { AppState } from '../../store/app-state';
import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';

@Injectable()
export class EntityMonitorFactory {

  constructor(private store: Store<AppState>) { }

  private monitorCache: {
    [key: string]: EntityMonitor
  } = {};

  public create<T>(
    id: string,
    entityKey: string,
    schema: normalizrSchema.Entity,
    startWithNull = true
  ): EntityMonitor<T> {
    const cacheKey = id + entityKey;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const monitor = new EntityMonitor<T>(
        this.store,
        id,
        entityKey,
        schema,
        startWithNull
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
