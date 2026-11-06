import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  EndpointsSignalConfigService,
} from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import.component';

function makeStubEndpointsSignalConfig() {
  return {
    // Only the methods kube-config-import touches need stubs; the rest of
    // the service's signal/computed surface is not read by this component.
    register: vi.fn().mockResolvedValue({ busy: false, error: false, message: 'new-endpoint-guid' }),
    unregister: vi.fn().mockResolvedValue({ busy: false, error: false, message: '' }),
  };
}

describe('KubeConfigImportComponent', () => {
  let component: KubeConfigImportComponent;
  let fixture: ComponentFixture<KubeConfigImportComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubEndpointsSignalConfig>;

  beforeEach(async () => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsSignalConfigService, useValue: stubSignalConfig },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        }
      ],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigImportComponent,
      ]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
