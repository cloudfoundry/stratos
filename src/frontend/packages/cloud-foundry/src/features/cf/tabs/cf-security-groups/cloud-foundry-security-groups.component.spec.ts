import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySecurityGroupsComponent } from "./cloud-foundry-security-groups.component";
describe('CloudFoundrySecurityGroupsComponent', () => {
  let component: CloudFoundrySecurityGroupsComponent;
  let fixture: ComponentFixture<CloudFoundrySecurityGroupsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundrySecurityGroupsComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        ActiveRouteCfOrgSpace,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySecurityGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
