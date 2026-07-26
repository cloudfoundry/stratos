import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EndpointModel } from '@stratosui/store';

import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { DuplicateUrlBannerComponent } from './duplicate-url-banner.component';

function ep(host: string): EndpointModel {
  return { api_endpoint: { Scheme: 'https', Host: host, Path: '' } } as unknown as EndpointModel;
}

describe('DuplicateUrlBannerComponent', () => {
  let connected$: BehaviorSubject<EndpointModel[]>;

  beforeEach(() => {
    connected$ = new BehaviorSubject<EndpointModel[]>([]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CloudFoundryService, useValue: { connectedCFEndpoints$: connected$.asObservable() } },
      ],
    });
  });

  it('hides the banner when no endpoints share a URL', () => {
    const fixture = TestBed.createComponent(DuplicateUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows the count and the default noun sentence', () => {
    connected$.next([ep('shared'), ep('shared')]);
    const fixture = TestBed.createComponent(DuplicateUrlBannerComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    // Endpoint-type label resolves via the entity catalog (empty in this
    // TestBed, so the cnsi_type falls through) - phrasing is what matters
    expect(text).toMatch(/A \S+ URL is shared by 2 endpoints\./);
    expect(text).toContain('Applications and organizations from each are shown together');
    expect(text).toContain('narrow to a single endpoint');
  });

  it('names the group sizes when endpoints share more than one URL', () => {
    connected$.next([ep('shared-a'), ep('shared-a'), ep('shared-b'), ep('shared-b')]);
    const fixture = TestBed.createComponent(DuplicateUrlBannerComponent);
    fixture.detectChanges();
    // 2 disjoint pairs (shared-a, shared-b), not one group of 4 - "4 X
    // endpoints" alone would misleadingly imply they all relate to each
    // other, so the sentence must name the actual group sizes.
    expect(fixture.nativeElement.textContent).toMatch(/2 \S+ URLs are shared by 4 endpoints \(2 and 2 per URL\)\./);
  });

  it('replaces the trailing sentence when a custom message is set', () => {
    connected$.next([ep('shared'), ep('shared')]);
    const fixture = TestBed.createComponent(DuplicateUrlBannerComponent);
    fixture.componentInstance.message = 'Several of the endpoints below are views of the same foundation.';
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toMatch(/A \S+ URL is shared by 2 endpoints\./);
    expect(text).toContain('Several of the endpoints below are views of the same foundation.');
    expect(text).not.toContain('shown together');
  });
});
