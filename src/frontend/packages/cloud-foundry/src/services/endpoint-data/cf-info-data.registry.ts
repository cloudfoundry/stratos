import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { CfInfoDataService } from './cf-info-data.service';

// Caches CfInfoDataService instances per cnsiGuid. Mirrors OrgDataRegistry /
// SpaceDataRegistry — sticky across navigation, root-scope singleton so every
// consumer in a CF endpoint subtree shares the same warm signal.
// Entries are kept for the session (sticky) on purpose; only evict() removes one.
@Injectable({ providedIn: 'root' })
export class CfInfoDataRegistry {
  private readonly http = inject(HttpClient);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly instances = new Map<string, CfInfoDataService>();

  acquire(cnsiGuid: string): CfInfoDataService {
    const existing = this.instances.get(cnsiGuid);
    if (existing) {
      return existing;
    }
    const service = new CfInfoDataService(this.http, cnsiGuid, this.diagnostics);
    this.instances.set(cnsiGuid, service);
    return service;
  }

  evict(cnsiGuid: string): void {
    this.instances.delete(cnsiGuid);
  }
}
