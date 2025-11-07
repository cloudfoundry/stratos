import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySpaceServiceMock } from "@test-framework/cloud-foundry-space.service.mock";
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceAppsComponent } from "./cloud-foundry-space-apps.component";
describe('CloudFoundrySpaceAppsComponent', () => {
  let component: CloudFoundrySpaceAppsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceAppsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceAppsComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        DatePipe,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
