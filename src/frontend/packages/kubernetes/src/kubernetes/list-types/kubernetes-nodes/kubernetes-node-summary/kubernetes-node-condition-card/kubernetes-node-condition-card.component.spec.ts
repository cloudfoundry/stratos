import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { BaseKubeGuid } from '../../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNode } from '../../../../store/kube.types';
import { KubernetesNodeConditionCardComponent } from './kubernetes-node-condition-card.component';
import { KubernetesNodeConditionComponent } from './kubernetes-node-condition/kubernetes-node-condition.component';

describe('KubernetesNodeConditionCardComponent', () => {
  let component: KubernetesNodeConditionCardComponent;
  let fixture: ComponentFixture<KubernetesNodeConditionCardComponent>;

  const mockNode: KubernetesNode = {
    metadata: {
      name: 'test-node',
      uid: 'test-uid',
      namespace: 'default',
      annotations: {
        'caasp.suse.com/version': '1.0.0',
        'caasp.suse.com/has-updates': 'yes',
        'caasp.suse.com/disruptive-updates': 'no',
        'caasp.suse.com/security-updates': 'yes'
      }
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          lastHeartbeatTime: '2025-11-13T00:00:00Z',
          lastTransitionTime: '2025-11-13T00:00:00Z',
          reason: 'KubeletReady',
          message: 'kubelet is posting ready status'
        }
      ],
      nodeInfo: {
        kubeletVersion: 'v1.28.0',
        kubeProxyVersion: 'v1.28.0',
        containerRuntimeVersion: 'containerd://1.7.0',
        osImage: 'Ubuntu 22.04',
        kernelVersion: '5.15.0',
        architecture: 'amd64',
        operatingSystem: 'linux',
        bootID: 'test-boot-id',
        machineID: 'test-machine-id',
        systemUUID: 'test-system-uuid'
      }
    }
  } as any;

  const mockKubernetesNodeService = {
    nodeName: 'test-node',
    kubeGuid: 'test-guid',
    node: signal(mockNode)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeConditionCardComponent,
        KubernetesNodeConditionComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        BaseKubeGuid,
        KubernetesEndpointService,
        {
          provide: KubernetesNodeService,
          useValue: mockKubernetesNodeService
        },
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
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeConditionCardComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows only the conditions the node reports', () => {
    const shown = fixture.debugElement.queryAll(By.directive(KubernetesNodeConditionComponent))
      .map(d => d.componentInstance as KubernetesNodeConditionComponent)
      .filter(c => c.hasCondition())
      .map(c => [c.condition(), c.conditionValue()]);
    expect(shown).toEqual([['Ready', true]]);
  });

  it('uses a host-set value for a row that is not a node condition', () => {
    const row = TestBed.createComponent(KubernetesNodeConditionComponent);
    row.componentRef.setInput('condition', 'CaaspUpdates');
    expect(row.componentInstance.hasCondition()).toBe(false);
    row.componentRef.setInput('overrideCondition', false);
    expect(row.componentInstance.hasCondition()).toBe(true);
    expect(row.componentInstance.conditionValue()).toBe(false);
  });
});
