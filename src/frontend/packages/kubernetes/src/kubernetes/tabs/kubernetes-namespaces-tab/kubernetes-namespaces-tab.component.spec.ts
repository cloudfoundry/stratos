import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SidePanelService } from '../../../../../core/src/shared/services/side-panel.service';
import { KubernetesResourceViewerComponent } from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespacesTabComponent } from './kubernetes-namespaces-tab.component';

const KUBE_GUID = 'kube-1';
const unreachable = {
  [KUBE_GUID]: { error: { statusCode: 500, status: 'Error proxying request' }, errorResponse: 'dial tcp: i/o timeout' },
};

describe('KubernetesNamespacesTabComponent', () => {
  let fixture: ComponentFixture<KubernetesNamespacesTabComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNamespacesTabComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BaseKubeGuid,
        // Namespace names render as router links.
        provideRouter([]),
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

  it('shows the failed-load state with the endpoint\'s reason when the namespace load fails', async () => {
    fixture = TestBed.createComponent(KubernetesNamespacesTabComponent);
    // A cold cache runs the endpoint's full load: version, namespaces, nodes.
    httpMock.expectOne('/pp/v1/proxy/version').flush(unreachable);
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces?limit=500').flush(unreachable);
    httpMock.expectOne('/pp/v1/proxy/api/v1/nodes?limit=500').flush(unreachable);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-test="empty"]')).toBeNull();
    expect(el.querySelector('[data-test="empty-error-detail"]')?.textContent?.trim())
      .toBe('Error proxying request: dial tcp: i/o timeout');
    expect(el.querySelector('[data-test="empty-error-retry"]')).not.toBeNull();
  });

  it('a Retry that loads the namespaces ends the failed-load state', async () => {
    fixture = TestBed.createComponent(KubernetesNamespacesTabComponent);
    httpMock.expectOne('/pp/v1/proxy/version').flush(unreachable);
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces?limit=500').flush(unreachable);
    httpMock.expectOne('/pp/v1/proxy/api/v1/nodes?limit=500').flush(unreachable);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('[data-test="empty-error-retry"]') as HTMLButtonElement).click();
    httpMock.expectOne('/pp/v1/proxy/api/v1/namespaces?limit=500')
      .flush({ [KUBE_GUID]: { items: [{ metadata: { name: 'default' } }] } });
    await fixture.whenStable();

    // Neither the failed-load state nor the endpoint's error banner stays:
    // the version and node failures of the same load are not this list's.
    expect(el.querySelector('[data-test="empty-error"]')).toBeNull();
    expect(el.querySelector('[data-test="errors"]')).toBeNull();
    expect(el.textContent).toContain('default');
  });

  // A namespace has no page of its own; its name opens it in the preview.
  it('a namespace name opens the namespace in the side-panel preview', () => {
    const show = vi.spyOn(TestBed.inject(SidePanelService), 'show').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(KubernetesNamespacesTabComponent);
    const col = fixture.componentInstance.listConfig()!.columns.find(c => c.key === 'name')!;
    expect(col.link).toBeUndefined();

    col.open!({ metadata: { name: 'ns-a' } } as any);

    expect(show).toHaveBeenCalledWith(KubernetesResourceViewerComponent, expect.objectContaining({ title: 'ns-a' }), expect.anything());
  });
});

// Links from pod and service lists carry the namespace as ?name=.
describe('KubernetesNamespacesTabComponent — ?name=', () => {
  it('opens filtered to the namespace named in ?name=', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [KubernetesNamespacesTabComponent, ...KubernetesBaseTestModules],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BaseKubeGuid,
        provideRouter([]),
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ name: 'ns-a' }) } } },
      ],
    }).compileComponents();
    TestBed.overrideProvider(KubernetesEndpointService, { useValue: { kubeGuid: KUBE_GUID } });

    const fixture = TestBed.createComponent(KubernetesNamespacesTabComponent);
    expect(fixture.componentInstance.signalConfig.nameFilter()).toBe('ns-a');
    TestBed.inject(HttpTestingController).match(() => true);
  });
});
