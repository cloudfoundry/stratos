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
    expect(fixture.componentInstance.message()).toContain('2 endpoints');
    expect(fixture.nativeElement.textContent).toContain('is shared by 2 endpoints');
  });

  it('reports mixed fleets per type as independent clauses, never a lump sum', () => {
    connected$.next([
      ep('cf-shared'), ep('cf-shared'),
      ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'),
    ]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    const msg = fixture.componentInstance.message();
    // Each type gets its own clause with its own verb - "X endpoints AND Y
    // endpoints share URLs" would read as if the two types shared a URL
    // with each other, which they never do (duplicate detection is
    // strictly within a type). Never a lump sum ("5") either.
    expect(msg).toMatch(/^A \S+ URL is shared by 2 endpoints; A \S+ URL is shared by 3 endpoints\.$/);
    expect(msg).not.toContain('5');
  });

  it('gives each of three or more types its own clause', () => {
    connected$.next([
      ep('cf-shared'), ep('cf-shared'),
      ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'),
      ep('metrics-shared', 'metrics'), ep('metrics-shared', 'metrics'),
    ]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.message())
      .toMatch(/^A \S+ URL is shared by 2 endpoints; A \S+ URL is shared by 2 endpoints; A \S+ URL is shared by 2 endpoints\.$/);
  });

  it('does not treat same-URL endpoints of different types as duplicates', () => {
    connected$.next([ep('same-host'), ep('same-host', 'k8s')]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.message()).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
