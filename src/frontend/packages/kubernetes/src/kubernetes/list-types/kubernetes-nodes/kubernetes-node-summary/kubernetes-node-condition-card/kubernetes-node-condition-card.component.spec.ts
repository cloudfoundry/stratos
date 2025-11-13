import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

import { EntityServiceFactory } from '@stratosui/store';
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
    nodeEntity$: of(mockNode),
    node$: of({ entity: mockNode, entityRequestInfo: {} } as any)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodeConditionCardComponent,
        KubernetesNodeConditionComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        EntityServiceFactory,
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
});
