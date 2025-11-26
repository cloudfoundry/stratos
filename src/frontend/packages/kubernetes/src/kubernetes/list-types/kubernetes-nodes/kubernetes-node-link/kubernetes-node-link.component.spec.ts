import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNodeLinkComponent } from './kubernetes-node-link.component';

describe('KubernetesNodeLinkComponent', () => {
  let component: KubernetesNodeLinkComponent;
  let fixture: ComponentFixture<KubernetesNodeLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeLinkComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        EntityServiceFactory,
        KubernetesEndpointService, BaseKubeGuid,
        provideZonelessChangeDetection(),
        provideRouter([]),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeLinkComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        namespace: 'test',
        name: 'test',
        uid: 'test'
      },
      status: {
        conditions: [],
        addresses: [],
        images: []
      },
      spec: {
        containers: [],
        nodeName: 'test',
        schedulerName: 'test',
        initContainers: [],
        readinessGates: []
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
