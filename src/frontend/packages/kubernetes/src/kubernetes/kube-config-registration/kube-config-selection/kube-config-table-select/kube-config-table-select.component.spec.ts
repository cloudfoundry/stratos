import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { entityCatalog } from '@stratosui/store';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { kubeEntityCatalog } from '../../../kubernetes-entity-generator';
import { KubeConfigHelper } from '../../kube-config.helper';
import type { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableSelectComponent } from './kube-config-table-select.component';

describe('KubeConfigTableSelectComponent', () => {
  let component: KubeConfigTableSelectComponent;
  let fixture: ComponentFixture<KubeConfigTableSelectComponent>;

  beforeEach(async () => {
    // Ensure the Kubernetes endpoint entity is registered in the catalog first
    // This is required because KubeConfigHelper -> KubeConfigAuthHelper depends on it
    // The KubeConfigAuthHelper accesses defn.subTypes which is only available when the endpoint is registered
    entityCatalog.register(kubeEntityCatalog.endpoint);

    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigTableSelectComponent,
      ],
      providers: [
        KubeConfigHelper,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableSelectComponent);
    component = fixture.componentInstance;
    component.row = {} as KubeConfigFileCluster;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
