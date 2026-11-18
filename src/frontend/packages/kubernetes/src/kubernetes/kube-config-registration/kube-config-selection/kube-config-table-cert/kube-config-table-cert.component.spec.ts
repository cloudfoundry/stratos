import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
  });

  // detectChanges, not whenStable: an open certificate request keeps the
  // fixture unstable until the test answers it.
  const show = (cluster: Partial<KubeConfigFileCluster['cluster']>) => {
    const row = { name: 'c1', cluster: { server: 'https://k8s.example', ...cluster } } as KubeConfigFileCluster;
    fixture.componentRef.setInput('row', row);
    fixture.detectChanges();
    return row;
  };

  it('should create', () => {
    show({ 'insecure-skip-tls-verify': true });
    expect(component).toBeTruthy();
  });

  it('ticks the box without asking when the file already skips TLS verification', async () => {
    show({ 'insecure-skip-tls-verify': true });
    // Match the certificate check only: the busy indicator fetches the branding file.
    TestBed.inject(HttpTestingController).expectNone(req => req.url.startsWith('/pp/v1/kube/cert'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-checkbox')).not.toBeNull();
  });

  it('asks whether the server needs a certificate, once, and records the answer on the row', async () => {
    const http = TestBed.inject(HttpTestingController);
    const row = show({});
    expect(fixture.nativeElement.querySelector('app-checkbox')).toBeNull();

    http.expectOne('/pp/v1/kube/cert?url=https://k8s.example').flush({ Status: 200, Required: true, Error: false, Message: '' });
    await fixture.whenStable();
    expect(row.cluster['insecure-skip-tls-verify']).toBe(true);
    expect(mockKubeConfigHelper.update).toHaveBeenCalledWith(row);
    expect(fixture.nativeElement.querySelector('app-checkbox')).not.toBeNull();

    // A later row does not ask again.
    show({});
    http.expectNone(req => req.url.startsWith('/pp/v1/kube/cert'));
  });
});
