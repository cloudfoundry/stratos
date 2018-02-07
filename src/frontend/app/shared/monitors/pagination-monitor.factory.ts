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
    schema: schema.Entity,
  ) {
    const cacheKey = paginationKey + schema.key;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const monitor = new PaginationMonitor(
        this.store,
        paginationKey,
        schema
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
