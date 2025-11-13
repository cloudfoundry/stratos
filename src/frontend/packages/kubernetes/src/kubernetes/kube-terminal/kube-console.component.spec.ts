import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { EndpointModel } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService } from '@stratosui/core';
import { KubeConsoleComponent } from './kube-console.component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';

describe('KubeConsoleComponent', () => {
  let component: KubeConsoleComponent;
  let fixture: ComponentFixture<KubeConsoleComponent>;

  beforeEach(async () => {
    const mockEndpoint: EndpointModel = {
      guid: 'test-endpoint-guid',
      name: 'Test Kubernetes Endpoint',
      connectionStatus: 'connected',
      user: {
        guid: 'test-user',
        name: 'test-user',
        admin: false
      }
    } as EndpointModel;

    const mockKubernetesEndpointService = {
      baseKube: { guid: 'test-endpoint-guid' },
      endpoint$: of({
        entity: mockEndpoint,
        metadata: {}
      })
    };

    await TestBed.configureTestingModule({
      imports: [
        KubeConsoleComponent,
        createBasicStoreModule(),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        TabNavService,
        {
          provide: KubernetesEndpointService,
          useValue: mockKubernetesEndpointService
        },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConsoleComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges to avoid ngOnInit and xterm initialization
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
