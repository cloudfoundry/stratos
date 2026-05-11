import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesNodesTabComponent } from './kubernetes-nodes-tab.component';

describe('KubernetesNodesTabComponent', () => {
  let component: KubernetesNodesTabComponent;
  let fixture: ComponentFixture<KubernetesNodesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodesTabComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EntityServiceFactory,
        BaseKubeGuid,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Absorb the initial node fetch dispatched by signalConfig.loadAll()
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
  });

  afterEach(() => {
    // Absorb any pending company-config / branding requests
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes a SignalListConfig once initialized', () => {
    expect(component.listConfig()).toBeDefined();
    const cfg = component.listConfig();
    expect(cfg?.columns?.length).toBeGreaterThan(0);
  });
});
