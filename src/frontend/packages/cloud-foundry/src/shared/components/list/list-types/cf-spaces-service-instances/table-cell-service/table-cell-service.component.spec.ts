import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { BooleanIndicatorComponent } from '@stratosui/core';
import {
  generateCfBaseTestModulesNoShared,
} from '@test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../../../data-services/long-running-cf-op.service';
import { ServiceInstanceLastOpComponent } from '../../../../service-instance-last-op/service-instance-last-op.component';
import { TableCellServiceComponent } from './table-cell-service.component';

describe('TableCellServiceComponent', () => {
  let component: TableCellServiceComponent;
  let fixture: ComponentFixture<TableCellServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceComponent,
        ServiceInstanceLastOpComponent,
        BooleanIndicatorComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        LongRunningCfOperationsService,
        provideZonelessChangeDetection(),
        provideRouter([]),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        service_plan_guid: 'service_plan_guid',
        space_guid: '',
        dashboard_url: '',
        type: '',
        service_guid: 'service_guid',
        service_plan_url: '',
        service_bindings_url: '',
        service_keys_url: '',
        routes_url: '',
        service_url: '',
      },
      metadata: {
        created_at: '',
        guid: 'guid',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
