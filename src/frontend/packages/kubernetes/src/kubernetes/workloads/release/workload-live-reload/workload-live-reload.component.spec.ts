import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { HelmReleaseGuidMock } from '../../../../helm/helm-testing.module';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { HelmReleaseSocketService } from '../helm-release-tab-base/helm-release-socket-service';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';
import { WorkloadLiveReloadComponent } from './workload-live-reload.component';

describe('WorkloadLiveReloadComponent', () => {
  let component: WorkloadLiveReloadComponent;
  let fixture: ComponentFixture<WorkloadLiveReloadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,

        WorkloadLiveReloadComponent,
      ]providers: [
        
        HelmReleaseSocketService,
        HelmReleaseHelperService,
        HelmReleaseGuidMock,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
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
