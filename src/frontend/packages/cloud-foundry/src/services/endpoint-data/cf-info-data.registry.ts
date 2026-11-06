import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { CfInfoDataService } from './cf-info-data.service';

interface RegistryEntry {
  service: CfInfoDataService;
  refCount: number;
}

// Caches CfInfoDataService instances per cnsiGuid. Mirrors OrgDataRegistry /
// SpaceDataRegistry — sticky across navigation, root-scope singleton so every
// consumer in a CF endpoint subtree shares the same warm signal.
@Injectable({ providedIn: 'root' })
export class CfInfoDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly instances = new Map<string, RegistryEntry>();

  acquire(cnsiGuid: string): CfInfoDataService {
    const existing = this.instances.get(cnsiGuid);
    if (existing) {
      existing.refCount++;
      return existing.service;
    }
    const service = new CfInfoDataService(this.http, cnsiGuid, this.diagnostics);
    this.instances.set(cnsiGuid, { service, refCount: 1 });
    return service;
  }

  release(cnsiGuid: string): void {
    const entry = this.instances.get(cnsiGuid);
    if (!entry) { return; }
    entry.refCount = Math.max(0, entry.refCount - 1);
  }

  evict(cnsiGuid: string): void {
    this.instances.delete(cnsiGuid);
  }
}
