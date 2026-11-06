import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { formatDuplicateUrlEndpointsMessage } from '@stratosui/store';

import { EndpointsService } from '../../../../core/endpoints.service';

/**
 * Page-level home banner that surfaces the shared-URL situation: when 2+
 * connected endpoints of the same type point at the same api_url, the home
 * page shows each as a separate card, so this explains that they're distinct
 * connections to the same target. The sentence comes from
 * {@link formatDuplicateUrlEndpointsMessage}, shared with the CF
 * duplicate-URL banner so both surfaces phrase it identically.
 */
@Component({
  selector: 'app-home-url-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as msg) {
      <div class="mx-4 mt-3 mb-2 px-3 py-2 rounded border flex items-start gap-2 text-sm bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)]">
        <span class="material-icons text-base leading-5">info</span>
        <span>{{ msg }}</span>
      </div>
    }
  `,
})
export class HomeUrlBannerComponent {
  private endpointsService = inject(EndpointsService);

  readonly message: Signal<string | null> = toSignal(
    this.endpointsService.connectedEndpoints$.pipe(
      map(endpoints => formatDuplicateUrlEndpointsMessage(endpoints)),
    ),
    { initialValue: null },
  );
}
