import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesPod } from '@stratosui/store';
import { KubernetesPodContainersComponent } from './kubernetes-pod-containers.component';

describe('KubernetesPodContainersComponent', () => {
  let component: KubernetesPodContainersComponent;
  let fixture: ComponentFixture<KubernetesPodContainersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        KubernetesPodContainersComponent,
        ...KubernetesBaseTestModules,
      ]}),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodContainersComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        uid: ''
      },
      status: {

      }
    } as KubernetesPod;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
