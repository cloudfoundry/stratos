import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../../core/test-framework/core-test.helper';
import { KubernetesStatus } from '../../store/kube.types';
import { KubernetesLabelsCellComponent } from './kubernetes-labels-cell.component';

describe('KubernetesLabelsCellComponent', () => {
  let component: KubernetesLabelsCellComponent;
  let fixture: ComponentFixture<KubernetesLabelsCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        KubernetesLabelsCellComponent,
        ...BaseTestModules
      ]})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesLabelsCellComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        labels: {},
        namespace: 'test',
        name: 'test',
        uid: 'test'
      },
      status: {
        phase: KubernetesStatus.ACTIVE
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
