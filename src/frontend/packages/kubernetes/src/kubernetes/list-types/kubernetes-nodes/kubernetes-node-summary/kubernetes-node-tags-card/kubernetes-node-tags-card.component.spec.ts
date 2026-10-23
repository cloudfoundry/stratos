import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseKubeGuid } from '../../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card.component';

describe('KubernetesNodeTagsCardComponent', () => {
  let component: KubernetesNodeTagsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeTagsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeTagsCardComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'anything',
                nodeName: 'test-node'
              },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubernetesNodeTagsCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Labels');
    fixture.componentRef.setInput('mode', 'labels');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
