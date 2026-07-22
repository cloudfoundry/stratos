import { ChangeDetectionStrategy, Component, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EndpointModel, EndpointsDataService } from '@stratosui/store';

// Result DTO from GET /pp/v1/cf/diag/urilimit/:cnsiGuid (#5579).
interface URILimitProbeResult {
  probedLimitBytes: number;
  cappedAtMax: boolean;
  configuredChunk: number;
  effectiveChunk: number;
  configuredBytes: number;
  adaptive: boolean;
  recommendedChunk: number;
  probeRequests: number;
}

interface ProbeState {
  running: boolean;
  result?: URILimitProbeResult;
  error?: string;
}

// Operator-triggered probe of each CF endpoint's composite URI-length
// ceiling. The limit is the min across every hop in the endpoint's proxy
// chain and cannot be derived from configuration — only measured. Nothing
// here runs automatically ("no churn to endpoints"): each probe is a
// button click issuing ~10 unauthenticated requests via the backend.
@Component({
  selector: 'app-diagnostic-probes-page',
  templateUrl: './diagnostic-probes-page.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticProbesPageComponent {
  private readonly http = inject(HttpClient);
  private readonly endpoints = inject(EndpointsDataService);

  readonly cfEndpoints: Signal<EndpointModel[]> = this.endpoints.endpointsByType('cf');
  private readonly states: WritableSignal<Map<string, ProbeState>> = signal(new Map());

  readonly hasEndpoints = computed(() => this.cfEndpoints().length > 0);

  constructor() {
    // Hydrate the endpoint list when landing on this tab directly.
    void this.endpoints.whenReady();
  }

  // guid is optional on EndpointModel; an endpoint without one has no probe state.
  stateFor(guid: string | undefined): ProbeState {
    if (!guid) { return { running: false }; }
    return this.states().get(guid) ?? { running: false };
  }

  address(ep: EndpointModel): string {
    const api = ep.api_endpoint;
    if (!api) { return ''; }
    return `${api.Scheme}://${api.Host}`;
  }

  // The probed ceiling is only comfortably used when the configured chunk
  // fits under it with the same reserve the backend recommendation uses.
  verdict(r: URILimitProbeResult): 'ok' | 'lower' | 'headroom' {
    if (r.configuredChunk > r.recommendedChunk) { return 'lower'; }
    if (r.recommendedChunk > r.configuredChunk * 1.2) { return 'headroom'; }
    return 'ok';
  }

  async probe(guid: string | undefined): Promise<void> {
    if (!guid) { return; }
    this.patch(guid, { running: true, result: undefined, error: undefined });
    try {
      const result = await firstValueFrom(
        this.http.get<URILimitProbeResult>(`/pp/v1/cf/diag/urilimit/${guid}`));
      this.patch(guid, { running: false, result });
    } catch (e: any) {
      const detail = e?.error?.detail ?? e?.message ?? 'probe failed';
      this.patch(guid, { running: false, error: String(detail) });
    }
  }

  private patch(guid: string, state: ProbeState): void {
    this.states.update(m => {
      const next = new Map(m);
      next.set(guid, state);
      return next;
    });
  }
}
