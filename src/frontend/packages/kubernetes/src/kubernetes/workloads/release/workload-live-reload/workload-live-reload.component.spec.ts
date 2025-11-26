import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { HelmReleaseSocketService } from '../helm-release-tab-base/helm-release-socket-service';
import { WorkloadLiveReloadComponent } from './workload-live-reload.component';

describe('WorkloadLiveReloadComponent', () => {
  let component: WorkloadLiveReloadComponent;
  let fixture: ComponentFixture<WorkloadLiveReloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,

        WorkloadLiveReloadComponent,
      ],
      providers: [
        ...HelmReleaseProviders,
        HelmReleaseSocketService,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkloadLiveReloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
