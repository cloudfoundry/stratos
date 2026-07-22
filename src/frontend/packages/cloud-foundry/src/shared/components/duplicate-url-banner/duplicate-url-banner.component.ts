import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointModel, formatDuplicateUrlEndpointsMessage } from '@stratosui/store';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';

// Shared dup-URL banner — surfaces when 2+ connected CF endpoints point at
// the same CAPI api_url. Used by Application Wall, Marketplace, and
// Services list pages so the operator knows aggregated rows can include
// near-duplicates from sibling endpoints (e.g. four `postgresql` offerings
// when four CFs share a foundation). Banner text is generic by design —
// each host page swaps the entity noun by passing it as `nounPlural`.
@Component({
  selector: 'app-duplicate-url-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (sharedUrlMessage$ | async; as sharedUrlMsg) {
      <div class="mx-4 mt-3 mb-2 px-3 py-2 rounded border flex items-start gap-2 text-sm"
           style="background-color: var(--info-bg); border-color: var(--info-border); color: var(--info-text);">
        <span class="material-icons text-base leading-5">info</span>
        <span>
          <div>{{ sharedUrlMsg }}</div>
          <div>
            @if (message) {
              {{ message }}
            } @else {
              {{ nounPlural }} from each are shown together — use the Cloud Foundry filter to narrow to a single endpoint.
            }
          </div>
        </span>
      </div>
    }
  `,
})
export class DuplicateUrlBannerComponent {
  private cloudFoundryService = inject(CloudFoundryService);

  // Subject noun for the banner — defaults to the original application-wall
  // wording; Marketplace and Services override via @Input.
  @Input() nounPlural: string = 'Applications and organizations';

  // Full replacement for the trailing sentence, for host pages where the
  // "shown together — use the filter" wording doesn't apply (e.g. the
  // Cloud Foundry endpoint picker, which lists endpoints, not entities).
  @Input() message: string = '';

  // Same sentence builder as the home banner - the two surfaces must not drift
  sharedUrlMessage$: Observable<string | null> =
    this.cloudFoundryService.connectedCFEndpoints$.pipe(
      map((endpoints: EndpointModel[]) => formatDuplicateUrlEndpointsMessage(endpoints)),
    );
}
