import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryStacksComponent } from "./cloud-foundry-stacks.component";
describe('CloudFoundryStacksComponent', () => {
  let component: CloudFoundryStacksComponent;
  let fixture: ComponentFixture<CloudFoundryStacksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryStacksComponent,
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
    fixture = TestBed.createComponent(CloudFoundryStacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
