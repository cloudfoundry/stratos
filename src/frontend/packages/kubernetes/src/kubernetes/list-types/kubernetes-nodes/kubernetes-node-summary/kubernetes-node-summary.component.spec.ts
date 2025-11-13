import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import {
  KubernetesNodeConditionCardComponent,
} from './kubernetes-node-condition-card/kubernetes-node-condition-card.component';
import {
  KubernetesNodeConditionComponent,
} from './kubernetes-node-condition-card/kubernetes-node-condition/kubernetes-node-condition.component';
import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card/kubernetes-node-info-card.component';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card/kubernetes-node-summary-card.component';
import { KubernetesNodeSummaryComponent } from './kubernetes-node-summary.component';
import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card/kubernetes-node-tags-card.component';

describe('KubernetesNodeSummaryComponent', () => {
  let component: KubernetesNodeSummaryComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeSummaryComponent,
        KubernetesNodeConditionComponent,
        KubernetesNodeConditionCardComponent,
        KubernetesNodeSummaryCardComponent,
        KubernetesNodeInfoCardComponent,
        KubernetesNodeTagsCardComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        EntityServiceFactory,
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'anything'
              },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
