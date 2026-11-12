import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { EndpointModel, formatDuplicateUrlEndpointsMessage } from '@stratosui/store';

// Shared dup-URL banner — surfaces when 2+ connected endpoints of the same
// type point at the same api_url. Endpoint-type-agnostic: the host page
// supplies the scoped endpoint list via `endpoints` (e.g. CF's
// Application Wall/Marketplace/Services pass connectedCFEndpoints, the
// Kubernetes workloads page passes its connected k8s endpoints, the Helm
// catalog its connected helm endpoints) so the message only ever mentions
// endpoints relevant to that page. Banner text is generic by design — each
// host page swaps the entity noun by passing it as `nounPlural`.
@Component({
  selector: 'app-duplicate-url-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (sharedUrlMessage(); as sharedUrlMsg) {
      <div class="mx-4 mt-3 mb-2 px-3 py-2 rounded border flex items-start gap-2 text-sm bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)]">
        <span class="material-icons text-base leading-5" aria-hidden="true">info</span>
        <span>
          <div>{{ sharedUrlMsg }}</div>
          <div>
            @if (message()) {
              {{ message() }}
            } @else {
              {{ nounPlural() }} from each are shown together — use the filter to narrow to a single endpoint.
            }
          </div>
        </span>
      </div>
    }
  `,
})
export class DuplicateUrlBannerComponent {
  // Scoped, connected endpoints for the host page. Required — there's
  // no sensible default endpoint type to fall back to.
  readonly endpoints = input.required<EndpointModel[]>();

  // Subject noun for the banner — each host page passes its own wording.
  readonly nounPlural = input<string>('Endpoints');

  // Full replacement for the trailing sentence, for host pages where the
  // "shown together — use the filter" wording doesn't apply (e.g. the
  // Cloud Foundry endpoint picker, which lists endpoints, not entities).
  readonly message = input<string>('');

  readonly sharedUrlMessage = computed(() => formatDuplicateUrlEndpointsMessage(this.endpoints()));
}
