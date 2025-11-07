import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { CoreModule } from '@stratosui/core/core.module';
import { SharedModule } from '@stratosui/core/shared.module';
import { TabNavService } from '@stratosui/core/tab-nav.service';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfEndpointsMissingComponent } from '@stratosui/shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CloudFoundryService } from '@stratosui/shared/data-services/cloud-foundry.service';
import { ServiceCatalogPageComponent } from "./service-catalog-page.component";
describe('ServiceCatalogPageComponent', () => {
  let component: ServiceCatalogPageComponent;
  let fixture: ComponentFixture<ServiceCatalogPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServiceCatalogPageComponent,
        CfEndpointsMissingComponent,
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        ...generateCfStoreModules(),
      ],
      providers: [
        EntityServiceFactory,
        TabNavService,
        CloudFoundryService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
