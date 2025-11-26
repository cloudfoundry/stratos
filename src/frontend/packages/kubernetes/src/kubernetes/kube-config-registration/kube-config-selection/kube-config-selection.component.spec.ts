import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { entityCatalog } from '@stratosui/store';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { KubeConfigSelectionComponent } from './kube-config-selection.component';

describe('KubeConfigSelectionComponent', () => {
  let component: KubeConfigSelectionComponent;
  let fixture: ComponentFixture<KubeConfigSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
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
});
