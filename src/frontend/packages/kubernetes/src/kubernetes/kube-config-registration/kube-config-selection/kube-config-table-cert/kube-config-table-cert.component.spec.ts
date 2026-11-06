import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigTableCertComponent } from './kube-config-table-cert.component';
import { KubeConfigFileCluster } from '../../kube-config.types';

describe('KubeConfigTableCertComponent', () => {
  let component: KubeConfigTableCertComponent;
  let fixture: ComponentFixture<KubeConfigTableCertComponent>;
  let mockKubeConfigHelper: Partial<KubeConfigHelper>;

  beforeEach(async () => {
    // Create a mock KubeConfigHelper with minimal required functionality
    mockKubeConfigHelper = {
      update: vi.fn((cluster: KubeConfigFileCluster) => {
        // Mock update method - no-op or simple validation
        return of(cluster);
      }),
      checkValidity: vi.fn(() => of({})),
      clustersChanged: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        KubeConfigTableCertComponent,
      ],
      providers: [
        {
          provide: KubeConfigHelper,
          useValue: mockKubeConfigHelper
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableCertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
