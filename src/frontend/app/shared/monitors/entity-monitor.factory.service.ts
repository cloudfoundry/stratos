import { Injectable } from '@angular/core';
import { EntityMonitor } from './entity-monitor';
import { AppState } from '../../store/app-state';
import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

@Injectable()
export class EntityMonitorFactory {

  constructor(private store: Store<AppState>) { }

  private monitorCache: {
    [key: string]: EntityMonitor
  } = {};

  public create(
    id: string,
    entityKey: string,
    schema: schema.Entity,
  ) {
    const cacheKey = id + entityKey;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const monitor = new EntityMonitor(
        this.store,
        id,
        entityKey,
        schema
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
