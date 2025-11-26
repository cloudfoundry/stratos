import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import type { KubeAPIResource } from '../../../store/kube.types';
import { KubernetesStatus } from '../../../store/kube.types';
import { KubernetesPodTagsComponent } from './kubernetes-pod-tags.component';

describe('KubernetesPodTagsComponent', () => {
  let component: KubernetesPodTagsComponent<KubeAPIResource>;
  let fixture: ComponentFixture<KubernetesPodTagsComponent<KubeAPIResource>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        KubernetesPodTagsComponent,
        ...KubernetesBaseTestModules,
      ]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodTagsComponent);
    component = fixture.componentInstance;
    component.row = {
      spec: {},
      status: {
        phase: KubernetesStatus.RUNNING,
      },
      metadata: {
        namespace: 'test',
        name: 'test',
        uid: 'test',
        labels: {}
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
