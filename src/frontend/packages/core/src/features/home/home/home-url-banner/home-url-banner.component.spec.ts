import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EndpointModel } from '@stratosui/store';

import { EndpointsService } from '../../../../core/endpoints.service';
import { HomeUrlBannerComponent } from './home-url-banner.component';

function ep(host: string): EndpointModel {
  return { api_endpoint: { Scheme: 'https', Host: host, Path: '' } } as unknown as EndpointModel;
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
    expect(fixture.componentInstance.duplicateCount()).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows the banner with the shared count when endpoints share a URL', () => {
    connected$.next([ep('shared'), ep('shared'), ep('unique')]);
    const fixture = TestBed.createComponent(HomeUrlBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.duplicateCount()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('share a URL');
  });
});
