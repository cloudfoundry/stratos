import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import {
  CfCellsListConfigService,
} from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfCell, ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellsComponent } from "./cloud-foundry-cells.component";
describe('CloudFoundryCellsComponent', () => {
  let component: CloudFoundryCellsComponent;
  let fixture: ComponentFixture<CloudFoundryCellsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryCellsComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        CfCellsListConfigService,
        {
          provide: ActiveRouteCfCell,
          useFactory: () => ({
            cfGuid: 'cfGuid',
            cellId: 'cellId'
          })
        },
        CloudFoundryEndpointService,
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        CfUserService,
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
