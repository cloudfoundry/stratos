import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesHomeCardComponent } from './kubernetes-home-card.component';

describe('KubernetesHomeCardComponent', () => {
  let component: KubernetesHomeCardComponent;
  let fixture: ComponentFixture<KubernetesHomeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [...KubernetesBaseTestModules,
        KubernetesHomeCardComponent,
      ],
      providers: [
        EntityServiceFactory,
        KubernetesEndpointService,
        BaseKubeGuid,
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

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesHomeCardComponent);
    component = fixture.componentInstance;
    component.endpoint = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
