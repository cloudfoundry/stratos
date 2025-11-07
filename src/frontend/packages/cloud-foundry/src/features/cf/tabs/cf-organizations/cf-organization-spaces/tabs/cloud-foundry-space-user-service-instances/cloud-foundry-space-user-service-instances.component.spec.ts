import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { getCfSpaceServiceMock } from "@test-framework/cloud-foundry-space.service.mock";
import { ServiceActionHelperService } from '../../../../../../../shared/data-services/service-action-helper.service';
import { CloudFoundrySpaceUserServiceInstancesComponent } from "./cloud-foundry-space-user-service-instances.component";
describe('CloudFoundrySpaceUserServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceUserServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUserServiceInstancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceUserServiceInstancesComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        getCfSpaceServiceMock, DatePipe, ServiceActionHelperService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceUserServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
