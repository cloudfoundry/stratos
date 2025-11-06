import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceActionHelperService } from '../../../shared/data-services/service-action-helper.service';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';
import { DetachServiceInstanceComponent } from './detach-service-instance.component';

describe('DetachServiceInstanceComponent', () => {
  let component: DetachServiceInstanceComponent;
  let fixture: ComponentFixture<DetachServiceInstanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetachServiceInstanceComponent, DetachAppsComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        DatePipe,
        TabNavService,
        ServiceActionHelperService, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                serviceInstanceId: 'serviceInstanceId',
                endpointId: 'endpointId'
              },
              queryParams: {}
            },
          }
        },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetachServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
