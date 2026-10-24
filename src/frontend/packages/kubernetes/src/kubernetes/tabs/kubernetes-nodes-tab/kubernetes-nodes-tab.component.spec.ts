import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EndpointErrorEventsService } from '@stratosui/store';

import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNodesTabComponent } from './kubernetes-nodes-tab.component';

const KUBE_GUID = 'kube-1';
const NODES_URL = '/pp/v1/proxy/api/v1/nodes?limit=500';

describe('KubernetesNodesTabComponent', () => {
  let component: KubernetesNodesTabComponent;
  let fixture: ComponentFixture<KubernetesNodesTabComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodesTabComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BaseKubeGuid,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
    TestBed.overrideProvider(KubernetesEndpointService, { useValue: { kubeGuid: KUBE_GUID } });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Absorb any pending company-config / branding requests
    httpMock.match(() => true);
  });

  // The constructor starts the node load; answer it, then let the view settle.
  const mount = async (nodesResponse: object) => {
    fixture = TestBed.createComponent(KubernetesNodesTabComponent);
    component = fixture.componentInstance;
    httpMock.expectOne(NODES_URL).flush(nodesResponse);
    await fixture.whenStable();
  };

  it('should create', async () => {
    await mount({ [KUBE_GUID]: { items: [] } });
    expect(component).toBeTruthy();
  });

  it('exposes a SignalListConfig once initialized', async () => {
    await mount({ [KUBE_GUID]: { items: [] } });
    expect(component.listConfig()).toBeDefined();
    const cfg = component.listConfig();
    expect(cfg?.columns?.length).toBeGreaterThan(0);
  });

  it('shows the loading state, not the empty message, while the nodes load', async () => {
    fixture = TestBed.createComponent(KubernetesNodesTabComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-test="empty"]')).toBeNull();
    expect(el.querySelector('[data-test="loading"]')).not.toBeNull();

    httpMock.expectOne(NODES_URL).flush({ [KUBE_GUID]: { items: [] } });
    // The load ends in the continuation after its response; let that run
    // before waiting for the view (nothing is pending until it does).
    await Promise.resolve();
    await fixture.whenStable();
    expect(el.querySelector('[data-test="loading"]')).toBeNull();
    expect(el.querySelector('[data-test="empty"]')).not.toBeNull();
  });

  it('records a failed node load in the endpoint error history', async () => {
    await mount({
      [KUBE_GUID]: { error: { statusCode: 500, status: 'Error proxying request' }, errorResponse: 'dial tcp: i/o timeout' },
    });
    expect(TestBed.inject(EndpointErrorEventsService).errorsForEndpoint(KUBE_GUID)()).toEqual([
      expect.objectContaining({ eventCode: '500', message: 'Error proxying request: dial tcp: i/o timeout' }),
    ]);
  });

  it('shows the failed-load state with the endpoint\'s reason and Retry when the node load fails', async () => {
    await mount({
      [KUBE_GUID]: { error: { statusCode: 500, status: 'Error proxying request' }, errorResponse: 'dial tcp: i/o timeout' },
    });

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-test="empty"]')).toBeNull();
    expect(el.querySelector('[data-test="empty-error"]')).not.toBeNull();
    expect(el.querySelector('[data-test="empty-error-detail"]')?.textContent?.trim())
      .toBe('Error proxying request: dial tcp: i/o timeout');
    expect(el.querySelector('[data-test="empty-error-retry"]')).not.toBeNull();
  });
});
