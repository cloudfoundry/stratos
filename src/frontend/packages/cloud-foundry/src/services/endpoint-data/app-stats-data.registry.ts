import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppStatsDataService } from './app-stats-data.service';

// Caches AppStatsDataService instances per (cnsiGuid, appGuid). Keeps
// app-list cards from re-firing /cf/app-stats on every re-render and
// gives the autoscaler card the same data the list uses. Mirrors
// OrgDataRegistry / SpaceDataRegistry.
@Injectable({ providedIn: 'root' })
export class AppStatsDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly instances = new Map<string, AppStatsDataService>();

  acquire(cnsiGuid: string, appGuid: string): AppStatsDataService {
    const key = this.key(cnsiGuid, appGuid);
    const existing = this.instances.get(key);
    if (existing) {
      return existing;
    }
    const service = new AppStatsDataService(this.http, cnsiGuid, appGuid);
    this.instances.set(key, service);
    return service;
  }

  evict(cnsiGuid: string, appGuid: string): void {
    this.instances.delete(this.key(cnsiGuid, appGuid));
  }

  private key(cnsiGuid: string, appGuid: string): string {
    return `${cnsiGuid}:${appGuid}`;
  }
}
