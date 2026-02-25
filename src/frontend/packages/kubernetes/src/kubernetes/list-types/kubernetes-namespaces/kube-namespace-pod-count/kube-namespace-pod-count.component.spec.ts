import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubeNamespacePodCountComponent } from './kube-namespace-pod-count.component';

describe('KubeNamespacePodCountComponent', () => {
  let component: KubeNamespacePodCountComponent;
  let fixture: ComponentFixture<KubeNamespacePodCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubeNamespacePodCountComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        KubeBaseGuidMock,
        KubernetesEndpointService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeNamespacePodCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
