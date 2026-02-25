import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { TabNavService } from '../../../../core/src/tab-nav.service';
import { populateStoreWithTestEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesNodeComponent } from './kubernetes-node.component';

describe('KubernetesNodeComponent', () => {
  let component: KubernetesNodeComponent;
  let fixture: ComponentFixture<KubernetesNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KubernetesNodeComponent, ...KubernetesBaseTestModules],
      providers: [
        EntityServiceFactory,
        TabNavService,
        KubeBaseGuidMock,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: testSCFEndpointGuid
              },
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    // Populate store with test endpoint data to prevent EmptyError in hasMetrics() observable
    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
