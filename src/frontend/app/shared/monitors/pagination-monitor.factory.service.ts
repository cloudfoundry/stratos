import { Injectable } from '@angular/core';
import { PaginationMonitor } from './pagination-monitor';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { schema } from 'normalizr';

@Injectable()
export class PaginationMonitorFactory {

  constructor(private store: Store<AppState>) { }

  private monitorCache: {
    [key: string]: PaginationMonitor
  } = {};

  public create(
    paginationKey: string,
    entityKey: string,
    schema: schema.Entity,
  ) {
    const cacheKey = paginationKey + entityKey;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const monitor = new PaginationMonitor(
        this.store,
        paginationKey,
        entityKey,
        schema
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
