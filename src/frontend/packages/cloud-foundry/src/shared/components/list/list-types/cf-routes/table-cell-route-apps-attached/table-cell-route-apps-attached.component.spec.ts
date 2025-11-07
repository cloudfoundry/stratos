import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySpaceServiceMock } from "@test-framework/cloud-foundry-space.service.mock";
import { CloudFoundrySpaceService } from '../../../../../../features/cf/services/cloud-foundry-space.service';
import { TableCellRouteAppsAttachedComponent } from "./table-cell-route-apps-attached.component";
describe('TableCellRouteAppsAttachedComponent', () => {
  let component: TableCellRouteAppsAttachedComponent;
  let fixture: ComponentFixture<TableCellRouteAppsAttachedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellRouteAppsAttachedComponent,
        AppChipsComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellRouteAppsAttachedComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        apps: [],
        domain_guid: 'test',
        space_guid: 'test'
      },
      metadata: null,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
