import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryBuildPacksComponent } from "./cloud-foundry-build-packs.component";
describe('CloudFoundryBuildPacksComponent', () => {
  let component: CloudFoundryBuildPacksComponent;
  let fixture: ComponentFixture<CloudFoundryBuildPacksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryBuildPacksComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        ActiveRouteCfOrgSpace,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBuildPacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
