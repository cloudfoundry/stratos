import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { NodePodCountComponent } from './node-pod-count.component';

describe('NodePodCountComponent', () => {
  let component: NodePodCountComponent;
  let fixture: ComponentFixture<NodePodCountComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NodePodCountComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        KubeBaseGuidMock, KubernetesEndpointService,
        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodePodCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
