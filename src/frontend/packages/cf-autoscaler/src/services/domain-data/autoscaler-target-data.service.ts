import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

export interface AutoscalerEndpointRef {
  guid: string;
  name: string;
  url: string;
  personal: boolean;
}

// Which autoscaler an app's Autoscale calls go to (the server's
// GET /autoscaler/apps/:appId/target). "registered": a registered
// autoscaler endpoint for one of the app's bindings. "default": the
// address guessed from the Cloud Foundry's (api. -> autoscaler.).
export interface AutoscalerTarget {
  source: 'registered' | 'default';
  endpoint?: AutoscalerEndpointRef;
  duplicates: {
    // Endpoints for the chosen autoscaler's broker, when more than one.
    registered: AutoscalerEndpointRef[];
    // Brokers of the app's bindings with a registered autoscaler, when
    // more than one.
    bound: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AutoscalerTargetDataService {
  private readonly http = inject(HttpClient);
  private readonly targets = signal<Map<string, AutoscalerTarget>>(new Map());

  target(cfGuid: string, appGuid: string): Signal<AutoscalerTarget | null> {
    return computed(() => this.targets().get(`${cfGuid}/${appGuid}`) ?? null);
  }

  // A failure leaves no target: the tab then works as before, without the line.
  async load(cfGuid: string, appGuid: string): Promise<void> {
    const url = `/pp/${environment.proxyAPIVersion}/autoscaler/apps/${appGuid}/target`;
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': cfGuid });
    try {
      const target = await firstValueFrom(this.http.get<AutoscalerTarget>(url, { headers }));
      this.targets.update(curr => new Map(curr).set(`${cfGuid}/${appGuid}`, target));
    } catch {
      // nothing to show
    }
  }
}
