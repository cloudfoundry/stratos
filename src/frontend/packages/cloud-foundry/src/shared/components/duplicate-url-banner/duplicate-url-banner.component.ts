import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointModel, getFullEndpointApiUrl } from '@stratosui/store';
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
    @if (duplicateCount$ | async; as dupCount) {
      <div class="mx-4 mt-3 mb-2 px-3 py-2 rounded border flex items-start gap-2 text-sm"
           style="background-color: var(--info-bg); border-color: var(--info-border); color: var(--info-text);">
        <span class="material-icons text-base leading-5">info</span>
        <span>
          {{ dupCount }} Cloud Foundry endpoints share a URL. {{ nounPlural }} from each are shown together —
          use the Cloud Foundry filter to view a single endpoint.
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

  duplicateCount$: Observable<number | null> =
    this.cloudFoundryService.connectedCFEndpoints$.pipe(
      map((endpoints: EndpointModel[]) => countDuplicateUrlEndpoints(endpoints)),
    );
}

// Counts endpoints whose api_url appears 2+ times across connected CFs.
// An endpoint is in a "duplicate group" if its URL is shared by another
// connected endpoint. Returns null when all URLs are distinct so the
// banner can early-exit via `@if … as dupCount`.
export function countDuplicateUrlEndpoints(endpoints: EndpointModel[]): number | null {
  if (!endpoints || endpoints.length < 2) return null;
  const urlCounts = new Map<string, number>();
  for (const ep of endpoints) {
    const url = getFullEndpointApiUrl(ep);
    urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
  }
  let dupCount = 0;
  for (const count of urlCounts.values()) {
    if (count > 1) dupCount += count;
  }
  return dupCount > 0 ? dupCount : null;
}
