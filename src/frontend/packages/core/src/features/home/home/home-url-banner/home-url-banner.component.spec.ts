import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EndpointModel } from '@stratosui/store';

import { EndpointsService } from '../../../../core/endpoints.service';
import { HomeUrlBannerComponent } from './home-url-banner.component';

function ep(host: string, type: string = 'cf'): EndpointModel {
  return { cnsi_type: type, api_endpoint: { Scheme: 'https', Host: host, Path: '' } } as unknown as EndpointModel;
}

describe('HomeUrlBannerComponent', () => {
  let connected$: BehaviorSubject<EndpointModel[]>;

  beforeEach(() => {
    connected$ = new BehaviorSubject<EndpointModel[]>([]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsService, useValue: { connectedEndpoints$: connected$.asObservable() } },
      ],
    });
  });

  it('hides the banner when no endpoints share a URL', () => {
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.message()).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows the banner with the shared count when endpoints share a URL', () => {
    connected$.next([ep('shared'), ep('shared'), ep('unique')]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.message()).toContain('2 ');
    expect(fixture.nativeElement.textContent).toContain('share a URL');
  });

  it('reports mixed fleets per type in a single combined sentence', () => {
    connected$.next([
      ep('cf-shared'), ep('cf-shared'),
      ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'),
    ]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    const msg = fixture.componentInstance.message();
    // Per-type counts joined into one sentence - never a lump sum ("5").
    // Every part carries its own "endpoints" noun and the verb agrees:
    // "2 X endpoints and 3 Y endpoints share URLs."
    expect(msg).toMatch(/2 \S+ endpoints and 3 \S+ endpoints share URLs\./);
    expect(msg).not.toContain('5');
  });

  it('joins three or more types with commas and a final "and"', () => {
    connected$.next([
      ep('cf-shared'), ep('cf-shared'),
      ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'),
      ep('metrics-shared', 'metrics'), ep('metrics-shared', 'metrics'),
    ]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.message())
      .toMatch(/^2 \S+ endpoints, 2 \S+ endpoints, and 2 \S+ endpoints share URLs\.$/);
  });

  it('does not treat same-URL endpoints of different types as duplicates', () => {
    connected$.next([ep('same-host'), ep('same-host', 'k8s')]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.message()).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
