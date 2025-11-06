import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../../../core/test-framework/core-test.helper';
import { KubernetesNodeCapacityComponent } from './kubernetes-node-capacity.component';

describe('KubernetesNodeCapacityComponent', () => {
  let component: KubernetesNodeCapacityComponent<any>;
  let fixture: ComponentFixture<KubernetesNodeCapacityComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        KubernetesNodeCapacityComponent,
        ...BaseTestModules
      ]})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeCapacityComponent);
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
        images: [],
        capacity: {
          pods: 100,
          memory: '100Ki',
          cpu: 100
        }
      },
      spec: {
        containers: [],
        nodeName: 'test',
        schedulerName: 'test',
        initContainers: []
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
