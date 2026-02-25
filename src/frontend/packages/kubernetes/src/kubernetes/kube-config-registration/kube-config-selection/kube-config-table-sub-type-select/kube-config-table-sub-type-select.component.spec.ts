import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableSubTypeSelectComponent } from './kube-config-table-sub-type-select.component';
import { entityCatalog } from '@stratosui/store';

describe('KubeConfigTableSubTypeSelectComponent', () => {
  let component: KubeConfigTableSubTypeSelectComponent;
  let fixture: ComponentFixture<KubeConfigTableSubTypeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        KubeConfigTableSubTypeSelectComponent,
      ],
      providers: [
        KubeConfigHelper,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Ensure entity catalog is initialized before creating the component
    // This triggers the catalog to load all the kubernetes entities including endpoint definitions
    entityCatalog.getAllEndpointTypes();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableSubTypeSelectComponent);
    component = fixture.componentInstance;
    component.row = {} as KubeConfigFileCluster;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
