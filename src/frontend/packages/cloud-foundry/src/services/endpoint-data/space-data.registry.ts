import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { SpaceDataService } from './space-data.service';

interface RegistryEntry {
  service: SpaceDataService;
  refCount: number;
}

// Caches SpaceDataService instances per (cnsiGuid, spaceGuid). Mirrors
// OrgDataRegistry — sticky across navigation away and back, so the
// space-detail subtree shares one warm signal across all consumers.
@Injectable({ providedIn: 'root' })
export class SpaceDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly instances = new Map<string, RegistryEntry>();

  acquire(cnsiGuid: string, spaceGuid: string): SpaceDataService {
    const key = this.key(cnsiGuid, spaceGuid);
    const existing = this.instances.get(key);
    if (existing) {
      existing.refCount++;
      return existing.service;
    }
    const service = new SpaceDataService(this.http, cnsiGuid, spaceGuid, this.diagnostics);
    this.instances.set(key, { service, refCount: 1 });
    return service;
  }

  release(cnsiGuid: string, spaceGuid: string): void {
    const entry = this.instances.get(this.key(cnsiGuid, spaceGuid));
    if (!entry) { return; }
    entry.refCount = Math.max(0, entry.refCount - 1);
  }

  evict(cnsiGuid: string, spaceGuid: string): void {
    this.instances.delete(this.key(cnsiGuid, spaceGuid));
  }

  private key(cnsiGuid: string, spaceGuid: string): string {
    return `${cnsiGuid}:${spaceGuid}`;
  }
}
