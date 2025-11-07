import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { KubernetesNodePodsComponent } from './kubernetes-node-pods.component';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('KubernetesNodePodsComponent', () => {
  let component: KubernetesNodePodsComponent;
  let fixture: ComponentFixture<KubernetesNodePodsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        KubernetesNodePodsComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        EntityServiceFactory,
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
