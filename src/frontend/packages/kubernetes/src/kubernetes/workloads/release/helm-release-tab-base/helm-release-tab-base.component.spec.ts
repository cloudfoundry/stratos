import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HelmReleaseProviders, KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { HelmReleaseTabBaseComponent } from './helm-release-tab-base.component';
import { HelmReleaseSocketService } from './helm-release-socket-service';


describe('HelmReleaseTabBaseComponent', () => {
  let component: HelmReleaseTabBaseComponent;
  let fixture: ComponentFixture<HelmReleaseTabBaseComponent>;

  // Create a complete mock that matches the service interface
  const mockSocketService = {
    start: vi.fn(),
    stop: vi.fn(),
    enable: vi.fn(),
    isStarted: vi.fn().mockReturnValue(false),
    pause: vi.fn(),
    isPaused: false,
    ngOnDestroy: vi.fn()
  };

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        HelmReleaseTabBaseComponent,
      ],
      providers: [
        ...HelmReleaseProviders,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        HttpClient,
        HttpHandler,
        provideZonelessChangeDetection(),
      ]
    });

    // Override the component-provided HelmReleaseSocketService with our mock
    TestBed.overrideProvider(HelmReleaseSocketService, { useValue: mockSocketService });

    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start socket service on initialization', () => {
    expect(mockSocketService.start).toHaveBeenCalled();
  });

  it('should stop socket service on destroy', () => {
    component.ngOnDestroy();
    expect(mockSocketService.stop).toHaveBeenCalled();
  });
});
