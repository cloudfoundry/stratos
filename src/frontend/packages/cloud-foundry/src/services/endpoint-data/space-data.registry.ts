import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { SpaceDataService } from './space-data.service';

// Caches SpaceDataService instances per (cnsiGuid, spaceGuid). Mirrors
// OrgDataRegistry — sticky across navigation away and back, so the
// space-detail subtree shares one warm signal across all consumers.
// Entries are kept for the session (sticky) on purpose; only evict() removes one.
@Injectable({ providedIn: 'root' })
export class SpaceDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly instances = new Map<string, SpaceDataService>();

  acquire(cnsiGuid: string, spaceGuid: string): SpaceDataService {
    const key = this.key(cnsiGuid, spaceGuid);
    const existing = this.instances.get(key);
    if (existing) {
      return existing;
    }
    const service = new SpaceDataService(this.http, cnsiGuid, spaceGuid, this.diagnostics);
    this.instances.set(key, service);
    return service;
  }

  evict(cnsiGuid: string, spaceGuid: string): void {
    this.instances.delete(this.key(cnsiGuid, spaceGuid));
  }

  private key(cnsiGuid: string, spaceGuid: string): string {
    return `${cnsiGuid}:${spaceGuid}`;
  }
}
