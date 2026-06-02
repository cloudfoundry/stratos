import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { SnackBarService } from '../../../../core/src/shared/services/snackbar.service';
import { SidePanelService } from '../../../../core/src/shared/services/side-panel.service';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import {
  ResourceAlertViewComponent,
} from './../analysis-report-viewer/resource-alert-preview/resource-alert-view/resource-alert-view.component';
import { KubernetesResourceViewerComponent } from './kubernetes-resource-viewer.component';

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
    const snack = TestBed.inject(SnackBarService);
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
});
