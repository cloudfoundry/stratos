import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BaseTestModules } from '../../../../../core/test-framework/core-test.helper';
import { SidePanelService } from '../../../../../core/src/shared/services/side-panel.service';
import { KubernetesResourceViewerComponent } from '../../kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubernetesNodePodsComponent } from './kubernetes-node-pods.component';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesTestingModule } from '../../kubernetes.testing.module';

const KUBE_GUID = 'kube-1';
const NODE_PODS_URL = '/pp/v1/proxy/api/v1/pods?limit=500&fieldSelector=spec.nodeName%3Dtest-node';

describe('KubernetesNodePodsComponent', () => {
  let component: KubernetesNodePodsComponent;
  let fixture: ComponentFixture<KubernetesNodePodsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodePodsComponent,
        ...BaseTestModules,
        KubernetesTestingModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {
                nodeName: 'test-node'
              }
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
    // The page reads the endpoint and node from the node service; pin
    // them so the pods load targets a known endpoint.
    TestBed.overrideProvider(KubernetesNodeService, { useValue: { kubeGuid: KUBE_GUID, nodeName: 'test-node' } });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Absorb any pending company-config request so HttpTestingController
    // doesn't fail verify().
    httpMock.match(() => true);
  });

  // Mounting starts the node's pods load; answer it, then let the view settle.
  const mount = async (podsResponse: object) => {
    fixture = TestBed.createComponent(KubernetesNodePodsComponent);
    component = fixture.componentInstance;
    httpMock.expectOne(NODE_PODS_URL).flush(podsResponse);
    await fixture.whenStable();
  };

  it('a pod\'s namespace opens the Namespaces tab filtered to it', async () => {
    await mount({ [KUBE_GUID]: { items: [] } });
    const col = component.listConfig()!.columns.find(c => c.key === 'namespace')!;
    const pod = { metadata: { kubeId: KUBE_GUID, name: 'p1', namespace: 'ns-a' } } as any;
    expect(col.link!(pod)).toEqual(['/kubernetes', KUBE_GUID, 'namespaces']);
    expect(col.linkQueryParams!(pod)).toEqual({ name: 'ns-a' });
  });

  it('a pod name opens the pod in the side-panel preview', async () => {
    const show = vi.spyOn(TestBed.inject(SidePanelService), 'show').mockImplementation(() => undefined);
    await mount({ [KUBE_GUID]: { items: [] } });
    const col = component.listConfig()!.columns.find(c => c.key === 'name')!;

    col.open!({ metadata: { kubeId: KUBE_GUID, name: 'p1', namespace: 'ns-a' } } as any);

    expect(show).toHaveBeenCalledWith(KubernetesResourceViewerComponent, expect.objectContaining({ title: 'p1' }), expect.anything());
  });

  it('should create', async () => {
    await mount({ [KUBE_GUID]: { items: [] } });
    expect(component).toBeTruthy();
  });

  it('shows the failed-load state with the endpoint\'s reason when the pods load fails', async () => {
    await mount({
      [KUBE_GUID]: { error: { statusCode: 403, status: '403 Forbidden' }, errorResponse: { message: 'pods is forbidden' } },
    });

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-test="empty-error"]')).not.toBeNull();
    expect(el.querySelector('[data-test="empty-error-detail"]')?.textContent?.trim())
      .toBe('403 Forbidden: pods is forbidden');
    expect(el.querySelector('[data-test="empty-error-retry"]')).not.toBeNull();
  });
});
