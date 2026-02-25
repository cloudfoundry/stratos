import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DatePipe } from '@angular/common';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { TabNavService } from '@stratosui/core';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { CoreTestingModule } from '../../../../../core/test-framework/core-test.modules';
import { AppTestModule } from '../../../../../core/test-framework/core-test.helper';
import { KubernetesTestingModule } from '../../kubernetes.testing.module';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasesTabComponent } from './releases-tab.component';
import { KubernetesNamespacesFilterService } from '../list-types/kube-namespaces-filter-config.service';

describe('ReleasesTabComponent', () => {
  let component: HelmReleasesTabComponent;
  let fixture: ComponentFixture<HelmReleasesTabComponent>;

  // Create a mock signal wrapper that matches the interface
  const createMockSignalWrapper = <T>(initialValue: T) => {
    const sig = signal(initialValue);
    return Object.assign(
      () => sig(),
      {
        set: (value: T) => sig.set(value),
        update: (fn: (value: T) => T) => sig.update(fn),
        asReadonly: () => sig.asReadonly(),
        next: (value: T) => sig.set(value),
        getValue: () => sig(),
        asObservable: () => of(sig()),
      }
    );
  };

  const mockKubernetesNamespacesFilterService = {
    kube: {
      list$: of([]),
      loading$: of(false),
      select: createMockSignalWrapper<string>(undefined)
    },
    namespace: {
      list$: of([]),
      loading$: of(false),
      select: createMockSignalWrapper<string>(undefined)
    },
    ngOnDestroy: vi.fn(),
    destroy: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
        AppTestModule,
        KubernetesTestingModule,
      ],
      providers: [
        HttpClient,
        DatePipe,
        HelmReleaseHelperService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        {
          provide: KubernetesNamespacesFilterService,
          useValue: mockKubernetesNamespacesFilterService
        },
        TabNavService,
        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(HelmReleasesTabComponent, {
      set: {
        providers: [
          {
            provide: KubernetesNamespacesFilterService,
            useValue: mockKubernetesNamespacesFilterService
          }
        ]
      }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleasesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
