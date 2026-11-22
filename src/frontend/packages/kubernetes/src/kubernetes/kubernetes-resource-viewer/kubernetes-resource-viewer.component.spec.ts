import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { TailwindSnackBarService } from '../../../../core/src/shared/services/tailwind-snackbar.service';
import { SidePanelService } from '../../../../core/src/shared/services/side-panel.service';
import { UserFavoriteManager } from '../../../../store/src/user-favorite-manager';
import { entityCatalog, generateStratosEntities, TestEntityCatalog } from '@stratosui/store';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import {
  ResourceAlertViewComponent,
} from './../analysis-report-viewer/resource-alert-preview/resource-alert-view/resource-alert-view.component';
import {
  KubernetesNamespacePreviewComponent,
} from '../kubernetes-namespace/kubernetes-namespace-preview/kubernetes-namespace-preview.component';
import { KubernetesUIConfigService } from '../kubernetes-ui-service';
import { KubernetesResourceViewerComponent, withResourcePreview } from './kubernetes-resource-viewer.component';

describe('KubernetesResourceViewerComponent', () => {
  let component: KubernetesResourceViewerComponent;
  let fixture: ComponentFixture<KubernetesResourceViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KubernetesResourceViewerComponent, ResourceAlertViewComponent, ...KubernetesBaseTestModules],
      providers: [
        KubernetesEndpointService,
        KubeBaseGuidMock,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'anything'
              },
              queryParams: {}
            }
          }
        },
        SidePanelService,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesResourceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deleteWarn deletes through the signal data service and snackbars success', async () => {
    const podData = TestBed.inject(KubePodDataService);
    const deleteSpy = vi.spyOn(podData, 'delete').mockResolvedValue(undefined);
    const snack = TestBed.inject(TailwindSnackBarService);
    const snackSpy = vi.spyOn(snack, 'show').mockImplementation(() => undefined as any);
    const sidePanel = TestBed.inject(SidePanelService);
    vi.spyOn(sidePanel, 'hide').mockImplementation(() => undefined as any);
    vi.spyOn(sidePanel, 'open').mockImplementation(() => undefined as any);
    // Auto-confirm the deletion dialog.
    vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
      .mockImplementation((_config: any, onConfirm: () => void) => { onConfirm(); return undefined as any; });

    component.data = {
      endpointId: 'cnsi-1',
      resource: { metadata: { name: 'p1', namespace: 'ns-a' } } as any,
      definition: { type: 'pod', label: 'Pod' } as any,
    };

    component.deleteWarn();
    await Promise.resolve();
    await Promise.resolve();

    expect(deleteSpy).toHaveBeenCalledWith('cnsi-1', 'p1', 'ns-a');
    expect(snackSpy).toHaveBeenCalledWith(`Deleted resource 'p1'`);
  });
  const pod = {
    kind: 'Pod',
    apiVersion: 'v1',
    metadata: { name: 'p1', namespace: 'ns-a', creationTimestamp: '2026-01-01T00:00:00Z' },
  } as any;

  // Wait for every pending timer and the zoneless scheduler, with no
  // extra fixture.detectChanges(): OnPush only re-renders on its own.
  const settle = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
  };

  it('renders the delete header once the panel opens, with no other interaction', async () => {
    component.setProps({ title: 'Preview', resource$: of(pod), resourceKind: 'Pod' });
    await settle();

    expect(fixture.nativeElement.querySelector('button[name="delete"]')).not.toBeNull();
  });

  it('renders the favorite star when the resource can be favorited', async () => {
    const favManager = TestBed.inject(UserFavoriteManager);
    vi.spyOn(favManager, 'canFavoriteEntityType').mockReturnValue(true);
    vi.spyOn(favManager, 'getFavorite').mockReturnValue({ guid: 'fav-1', entityType: 'pod', getPrettyTypeName: () => 'Pod' } as any);

    component.setProps({
      title: 'Preview',
      resource$: of(pod),
      resourceKind: 'Pod',
      definition: { type: 'pod', label: 'Pod' },
    });
    await settle();

    expect(fixture.nativeElement.querySelector('app-entity-favorite-star')).not.toBeNull();
  });

  it('deleteWarn falls back to the resource kind when there is no definition', async () => {
    const podData = TestBed.inject(KubePodDataService);
    const deleteSpy = vi.spyOn(podData, 'delete').mockResolvedValue(undefined);
    vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show').mockImplementation(() => undefined as any);
    const sidePanel = TestBed.inject(SidePanelService);
    vi.spyOn(sidePanel, 'hide').mockImplementation(() => undefined as any);
    let title = '';
    vi.spyOn(TestBed.inject(ConfirmationDialogService), 'openWithCancel')
      .mockImplementation((config: any, onConfirm: () => void) => { title = config.title; onConfirm(); return undefined as any; });

    // The helm release resource graph opens the viewer with no definition.
    component.setProps({ title: 'Preview', resource$: of(pod), resourceKind: 'Pod' });
    await settle();

    expect(() => component.deleteWarn()).not.toThrow();
    await Promise.resolve();

    expect(title).toBe('Delete Pod');
    expect(deleteSpy).toHaveBeenCalledWith(expect.anything(), 'p1', 'ns-a');
  });

  // Lists pass the kind as its label ("Pod"); the helm release graph passes
  // the Kubernetes kind, also "Pod".
  it('checks pod metrics for a pod whatever the kind\'s case', async () => {
    const hasMetrics = vi.spyOn(TestBed.inject(EndpointsService), 'hasMetrics').mockReturnValue(of(true));
    component.setProps({ title: 'Preview', resource$: of(pod), resourceKind: 'Pod' });

    expect(await firstValueFrom(component.hasPodMetrics$)).toBe(true);
    expect(hasMetrics).toHaveBeenCalled();
  });

  // The Kubernetes lists open a row here from its Name cell. The list's
  // injector carries the Kubernetes tab's endpoint services, which the
  // side-panel host above the routes does not.
  describe('withResourcePreview', () => {
    beforeEach(() => {
      const catalog = entityCatalog as TestEntityCatalog;
      catalog.clear();
      [...generateStratosEntities(), ...kubeEntityCatalog.allKubeEntities()].forEach(e => entityCatalog.register(e));
    });

    const listConfig = {
      columns: [
        { header: 'Name', key: 'name', render: (r: any) => r.metadata.name },
        { header: 'Age', key: 'age', render: () => '' },
      ],
    } as any;

    it('opens a row from the Name cell in the viewer, with the list injector', async () => {
      const show = vi.spyOn(TestBed.inject(SidePanelService), 'show').mockImplementation(() => undefined);
      const injector = TestBed.inject(Injector);

      const config = withResourcePreview(listConfig, 'pod', injector);
      expect(config.columns[1].open).toBeUndefined();
      config.columns[0].open!(pod);

      expect(show).toHaveBeenCalledWith(KubernetesResourceViewerComponent, expect.anything(), injector);
      const props = show.mock.calls[0][1] as any;
      expect(props.title).toBe('p1');
      expect(props.resourceKind).toBe('Pod');
      expect(props.definition?.type).toBe('pod');
      expect(props.component).toBeUndefined();
      expect(await firstValueFrom(props.resource$)).toBe(pod);
    });

    it('shows the namespace preview inside the viewer for a namespace', () => {
      const show = vi.spyOn(TestBed.inject(SidePanelService), 'show').mockImplementation(() => undefined);
      TestBed.inject(KubernetesUIConfigService).previewComponent.set('namespace', KubernetesNamespacePreviewComponent);

      const config = withResourcePreview(listConfig, 'namespace', TestBed.inject(Injector));
      config.columns[0].open!({ metadata: { name: 'ns-a' } });

      const props = show.mock.calls[0][1] as any;
      expect(props.resourceKind).toBe('Namespace');
      expect(props.component).toBe(KubernetesNamespacePreviewComponent);
    });
  });
});
