import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { countDuplicateUrlEndpoints } from '@stratosui/store';

import { EndpointsService } from '../../../../core/endpoints.service';

/**
 * Page-level home banner that surfaces the shared-URL situation: when 2+
 * connected endpoints point at the same api_url, the home page shows each as
 * a separate card, so this explains that they're distinct connections to the
 * same foundation. Generic across endpoint types — the detection
 * ({@link countDuplicateUrlEndpoints}) is the same one the CF Application
 * Wall / Marketplace / Services banner uses.
 */
@Component({
  selector: 'app-home-url-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (duplicateCount(); as dupCount) {
      <div class="mx-4 mt-3 mb-2 px-3 py-2 rounded border flex items-start gap-2 text-sm"
           style="background-color: var(--info-bg); border-color: var(--info-border); color: var(--info-text);">
        <span class="material-icons text-base leading-5">info</span>
        <span>
          {{ dupCount }} Cloud Foundry endpoints share a URL. Applications and organizations from
          each are shown together — use the Cloud Foundry filter to view a single endpoint.
        </span>
      </div>
    }
  `,
})
export class HomeUrlBannerComponent {
  private endpointsService = inject(EndpointsService);

  readonly duplicateCount: Signal<number | null> = toSignal(
    this.endpointsService.connectedEndpoints$.pipe(
      map(endpoints => countDuplicateUrlEndpoints(endpoints)),
    ),
    { initialValue: null },
  );
}
