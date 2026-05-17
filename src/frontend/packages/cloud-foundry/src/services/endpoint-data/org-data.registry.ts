import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { OrgDataService } from './org-data.service';

interface RegistryEntry {
  service: OrgDataService;
  refCount: number;
}

// Caches OrgDataService instances per (cnsiGuid, orgGuid). Mirrors
// EndpointDataRegistry — keeps state warm across navigation away and back to
// the same org-detail page, and gives every consumer in the org-detail tree a
// shared instance (so in-flight dedup + cached signals actually take effect).
@Injectable({ providedIn: 'root' })
export class OrgDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly instances = new Map<string, RegistryEntry>();

  acquire(cnsiGuid: string, orgGuid: string): OrgDataService {
    const key = this.key(cnsiGuid, orgGuid);
    const existing = this.instances.get(key);
    if (existing) {
      existing.refCount++;
      return existing.service;
    }
    const service = new OrgDataService(this.http, cnsiGuid, orgGuid, this.diagnostics);
    this.instances.set(key, { service, refCount: 1 });
    return service;
  }

  release(cnsiGuid: string, orgGuid: string): void {
    const entry = this.instances.get(this.key(cnsiGuid, orgGuid));
    if (!entry) { return; }
    entry.refCount = Math.max(0, entry.refCount - 1);
    // Instance stays in map sticky — only removed on explicit evict.
  }

  evict(cnsiGuid: string, orgGuid: string): void {
    this.instances.delete(this.key(cnsiGuid, orgGuid));
  }

  private key(cnsiGuid: string, orgGuid: string): string {
    return `${cnsiGuid}:${orgGuid}`;
  }
}
