import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseKubeGuid } from '../../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card.component';

describe('KubernetesNodeInfoCardComponent', () => {
  let component: KubernetesNodeInfoCardComponent;
  let fixture: ComponentFixture<KubernetesNodeInfoCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        KubernetesNodeInfoCardComponent,
        ...KubernetesBaseTestModules
      ],
      providers: [
        BaseKubeGuid, KubernetesNodeService, KubernetesEndpointService,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
