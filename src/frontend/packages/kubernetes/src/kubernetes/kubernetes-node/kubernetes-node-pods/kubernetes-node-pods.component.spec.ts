import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store';
import { BaseTestModules } from '../../../../../core/test-framework/core-test.helper';
import { KubernetesNodePodsComponent } from './kubernetes-node-pods.component';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesTestingModule } from '../../kubernetes.testing.module';

describe('KubernetesNodePodsComponent', () => {
  let component: KubernetesNodePodsComponent;
  let fixture: ComponentFixture<KubernetesNodePodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesNodePodsComponent,
        ...BaseTestModules,
        KubernetesTestingModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EntityServiceFactory,
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {
                nodeName: 'test-node'
              }
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Absorb any pending company-config / pods request so HttpTestingController
    // doesn't fail verify(). Component init triggers a pods fetch through the
    // signal-config; we don't assert on it here — KubePodDataService spec covers
    // that path. We only need the component to mount.
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
