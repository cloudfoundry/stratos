import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseTestModules } from '../../../../../../core/test-framework/core-test.helper';
import { KubernetesNodePressureComponent } from './kubernetes-node-pressure.component';

describe('KubernetesNodePressureComponent', () => {
  let component: KubernetesNodePressureComponent;
  let fixture: ComponentFixture<KubernetesNodePressureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [EntityServiceFactory, provideZonelessChangeDetection()],
      imports: [
        KubernetesNodePressureComponent,
        ...BaseTestModules,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodePressureComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        labels: {},
        namespace: 'test',
        name: 'test',
        uid: 'test'
      },
      status: {
        conditions: [],
        addresses: [],
        images: []
      },
      spec: {
        containers: [],
        nodeName: 'test',
        schedulerName: 'test',
        initContainers: [],
        readinessGates: []
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
