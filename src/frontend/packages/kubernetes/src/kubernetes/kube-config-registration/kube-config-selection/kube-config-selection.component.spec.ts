import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { entityCatalog } from '@stratosui/store';
import {
  TailwindSnackBarRef,
  TailwindSnackBarService,
} from '../../../../../core/src/shared/services/tailwind-snackbar.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { KubeConfigHelper } from '../kube-config.helper';
import { KubeConfigSelectionComponent } from './kube-config-selection.component';

describe('KubeConfigSelectionComponent', () => {
  let component: KubeConfigSelectionComponent;
  let fixture: ComponentFixture<KubeConfigSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Provided by the registration wizard in the app (the helper must
        // outlive the lazily-instantiated selection step) — the spec hosts
        // the component directly, so provide it here.
        KubeConfigHelper,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        }
      ],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigSelectionComponent,
      ]}).compileComponents();

    // Ensure the Kubernetes endpoint entity is registered in the catalog
    // This is required because KubeConfigHelper -> KubeConfigAuthHelper depends on it
    // The KubeConfigAuthHelper accesses defn.subTypes which is only available when the endpoint is registered
    entityCatalog.register(kubeEntityCatalog.endpoint);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // A new parse clears only this step's own "Failed to load Kube Config"
  // message; hide() would also dismiss other features' messages.
  it('clears only its own parse error when parsing again', async () => {
    const snackbar = TestBed.inject(TailwindSnackBarService);
    const firstRef = { dismiss: vi.fn(), afterDismissed: () => of(null) };
    const show = vi.spyOn(snackbar, 'show').mockReturnValue(firstRef as unknown as TailwindSnackBarRef<unknown>);
    const hide = vi.spyOn(snackbar, 'hide');
    vi.spyOn(TestBed.inject(KubeConfigHelper), 'parse').mockReturnValue(of('bad yaml'));

    component.clustersParse('first');
    await fixture.whenStable();
    expect(show).toHaveBeenCalledWith('Failed to load Kube Config: bad yaml', 'Close');
    expect(firstRef.dismiss).not.toHaveBeenCalled();

    component.clustersParse('second');
    await fixture.whenStable();
    expect(firstRef.dismiss).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
  });
});
