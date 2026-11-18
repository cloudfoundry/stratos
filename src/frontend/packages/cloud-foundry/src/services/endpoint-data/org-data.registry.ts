import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { OrgDataService } from './org-data.service';

// Caches OrgDataService instances per (cnsiGuid, orgGuid). Mirrors
// EndpointDataRegistry — keeps state warm across navigation away and back to
// the same org-detail page, and gives every consumer in the org-detail tree a
// shared instance (so in-flight dedup + cached signals actually take effect).
// Entries are kept for the session (sticky) on purpose; only evict() removes one.
@Injectable({ providedIn: 'root' })
export class OrgDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly instances = new Map<string, OrgDataService>();

  acquire(cnsiGuid: string, orgGuid: string): OrgDataService {
    const key = this.key(cnsiGuid, orgGuid);
    const existing = this.instances.get(key);
    if (existing) {
      return existing;
    }
    const service = new OrgDataService(this.http, cnsiGuid, orgGuid, this.diagnostics);
    this.instances.set(key, service);
    return service;
  }

  evict(cnsiGuid: string, orgGuid: string): void {
    this.instances.delete(this.key(cnsiGuid, orgGuid));
  }

  /** Cached instance lookup without creating one. */
  peek(cnsiGuid: string, orgGuid: string): OrgDataService | undefined {
    return this.instances.get(this.key(cnsiGuid, orgGuid));
  }

  // Every cached instance for an endpoint — mutation cleanups that only
  // know the deleted child's guid (not its parent org) walk these and let
  // the per-instance patch no-op where the child isn't held.
  peekByCnsi(cnsiGuid: string): OrgDataService[] {
    const prefix = `${cnsiGuid}:`;
    return [...this.instances.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, service]) => service);
  }

  private key(cnsiGuid: string, orgGuid: string): string {
    return `${cnsiGuid}:${orgGuid}`;
  }
}
