import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';

import { EndpointModel } from '../../../../store/src/public-api';

import { TabNavService } from '../../../../core/src/tab-nav.service';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesComponent } from './kubernetes.component';

describe('KubernetesComponent', () => {
  let component: KubernetesComponent;
  let fixture: ComponentFixture<KubernetesComponent>;
  const kubeEndpoints = signal<EndpointModel[]>([]);
  const kube = (guid: string, connectionStatus: string) =>
    ({ guid, cnsi_type: 'k8s', connectionStatus } as unknown as EndpointModel);

  beforeEach(async () => {
    kubeEndpoints.set([]);
    TestBed.overrideComponent(KubernetesComponent, {
      set: { providers: [{ provide: KubernetesService, useValue: { kubeEndpoints } }] },
    });
    await TestBed.configureTestingModule({
      imports: [
        KubernetesComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  const create = () => {
    fixture = TestBed.createComponent(KubernetesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', () => {
    create();
    expect(component).toBeTruthy();
  });

  it('goes straight to the only connected endpoint', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    kubeEndpoints.set([kube('k1', 'connected'), kube('k2', 'expired')]);
    create();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['kubernetes', 'k1']);
    expect(component.showList()).toBe(false);
  });

  it('lists several connected endpoints and keeps the list', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    kubeEndpoints.set([kube('k1', 'connected'), kube('k2', 'connected')]);
    create();
    await fixture.whenStable();
    expect(component.showList()).toBe(true);

    kubeEndpoints.set([kube('k1', 'connected')]);
    await fixture.whenStable();
    expect(component.showList()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
