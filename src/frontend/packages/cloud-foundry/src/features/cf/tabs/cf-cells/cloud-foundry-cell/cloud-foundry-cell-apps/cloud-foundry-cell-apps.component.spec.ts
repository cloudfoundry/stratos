import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellAppsComponent } from './cloud-foundry-cell-apps.component';

describe('CloudFoundryCellAppsComponent', () => {
  let component: CloudFoundryCellAppsComponent;
  let fixture: ComponentFixture<CloudFoundryCellAppsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryCellAppsComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        ActiveRouteCfCell,
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
