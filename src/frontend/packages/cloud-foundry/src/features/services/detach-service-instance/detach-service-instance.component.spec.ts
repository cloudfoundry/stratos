import { DatePipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { PaginationMonitorFactory, EntityServiceFactory, EntityMonitorFactory, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { CloudFoundryTestingModule } from "@test-framework/cf";
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ServiceActionHelperService } from '../../../shared/data-services/service-action-helper.service';
import { DetachServiceInstanceComponent } from "./detach-service-instance.component";

describe('DetachServiceInstanceComponent', () => {
  let component: DetachServiceInstanceComponent;
  let fixture: ComponentFixture<DetachServiceInstanceComponent>;

  const cfGuid = 'test-cf-guid';
  const serviceInstanceId = 'test-service-instance-id';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DetachServiceInstanceComponent,
        HttpClientTestingModule,
        createBasicStoreModule(),
        CloudFoundryTestingModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        DatePipe,
        TabNavService,
        ServiceActionHelperService,
        PaginationMonitorFactory,
        EntityServiceFactory,
        EntityMonitorFactory,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                serviceInstanceId,
                endpointId: cfGuid
              },
              queryParams: {}
            },
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  it('should create', () => {
    fixture = TestBed.createComponent(DetachServiceInstanceComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
