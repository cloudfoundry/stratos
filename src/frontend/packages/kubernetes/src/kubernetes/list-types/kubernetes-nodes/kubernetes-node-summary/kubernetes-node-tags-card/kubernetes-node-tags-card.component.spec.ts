import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
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

describe('KubernetesNodeTagsCardComponent chips', () => {
  const node = signal<unknown>(undefined);

  it('lists the chosen metadata as key:value chips, none while the node is missing', async () => {
    await TestBed.configureTestingModule({
      imports: [KubernetesNodeTagsCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: KubernetesNodeService, useValue: { node } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KubernetesNodeTagsCardComponent);
    fixture.componentRef.setInput('title', 'Labels');
    fixture.componentRef.setInput('mode', 'labels');
    const component = fixture.componentInstance;
    expect(component.chipTags()).toEqual([]);

    node.set({ metadata: { labels: { zone: 'a', role: 'worker' } } });
    expect(component.chipTags()).toEqual([{ value: 'zone:a' }, { value: 'role:worker' }]);

    // A node without that metadata key has no chips.
    fixture.componentRef.setInput('mode', 'annotations');
    expect(component.chipTags()).toEqual([]);
  });
});
