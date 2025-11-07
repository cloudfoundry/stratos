import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseTestModules } from '../../../../../../core/test-framework/core-test.helper';
import { KubernetesNodeLabelsComponent } from './kubernetes-node-labels.component';

describe('KubernetesNodeLabelsComponent', () => {
  let component: KubernetesNodeLabelsComponent;
  let fixture: ComponentFixture<KubernetesNodeLabelsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityServiceFactory, provideZonelessChangeDetection()],
      imports: [
        KubernetesNodeLabelsComponent,
        ...BaseTestModules,
      ]}),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeLabelsComponent);
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
