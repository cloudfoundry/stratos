import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesPod, KubernetesStatus } from '../../../store/kube.types';
import { KubernetesPodStatusComponent } from './kubernetes-pod-status.component';

describe('KubernetesPodStatusComponent', () => {
  let component: KubernetesPodStatusComponent;
  let fixture: ComponentFixture<KubernetesPodStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        KubernetesPodStatusComponent,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodStatusComponent);
    component = fixture.componentInstance;
    component.row = {
      status: {
        phase: KubernetesStatus.FAILED,
      },
      spec: {
        containers: []
      },
      expandedStatus: {}
    } as KubernetesPod;
    // Skip detectChanges — list infrastructure base class subscribes to
    // uninitialized observables via take(1) without full data source setup
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
