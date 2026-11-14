import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DatePipe } from '@angular/common';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { CoreTestingModule } from '../../../../../core/test-framework/core-test.modules';
import { AppTestModule } from '../../../../../core/test-framework/core-test.helper';
import { KubernetesTestingModule } from '../../kubernetes.testing.module';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasesTabComponent } from './releases-tab.component';

describe('ReleasesTabComponent', () => {
  let component: HelmReleasesTabComponent;
  let fixture: ComponentFixture<HelmReleasesTabComponent>;

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
        TabNavService,
        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(HelmReleasesTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
