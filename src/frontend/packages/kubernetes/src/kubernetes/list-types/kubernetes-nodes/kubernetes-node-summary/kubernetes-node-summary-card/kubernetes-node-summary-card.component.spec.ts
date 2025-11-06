import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseKubeGuid } from '../../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card.component';

describe('KubernetesNodeSummaryCardComponent', () => {
  let component: KubernetesNodeSummaryCardComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        KubernetesNodeSummaryCardComponent,
        ...KubernetesBaseTestModules
      ],
      providers: [
        BaseKubeGuid, KubernetesEndpointService, KubernetesNodeService,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
