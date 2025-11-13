import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MDAppModule } from '../../../../../../core/src/public-api';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { ResourceAlertViewComponent } from './resource-alert-view.component';

describe('ResourceAlertViewComponent', () => {
  let component: ResourceAlertViewComponent;
  let fixture: ComponentFixture<ResourceAlertViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesBaseTestModules,
        MDAppModule,
        ResourceAlertViewComponent,
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceAlertViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
