import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationsComponent } from './cloud-foundry-organizations.component';

describe('CloudFoundryOrganizationsComponent', () => {
  let component: CloudFoundryOrganizationsComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationsComponent],
      providers: [
        generateTestCfEndpointServiceProvider(), TabNavService,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules()
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
