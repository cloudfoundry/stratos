import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppChipsComponent } from '@stratosui/core';
import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { TableCellServiceInstanceTagsComponent } from './table-cell-service-instance-tags.component';
describe('TableCellServiceInstanceTagsComponent', () => {
  let component: TableCellServiceInstanceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceInstanceTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...generateCfBaseTestModulesNoShared(),
        TableCellServiceInstanceTagsComponent,
        AppChipsComponent,
    ],
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        provideZonelessChangeDetection(),
      ]

    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TableCellServiceInstanceTagsComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: 'test-instance',
        credentials: {},
        space_guid: 'test-space-guid',
        space_url: '/v2/spaces/test-space-guid',
        type: 'user_provided_service_instance',
        syslog_drain_url: '',
        tags: ['test-tag-1', 'test-tag-2'],
        service_bindings_url: '/v2/user_provided_service_instances/test-guid/service_bindings',
        routes_url: '/v2/user_provided_service_instances/test-guid/routes',
        route_service_url: ''
      } as any,
      metadata: {
        created_at: '2023-01-01T00:00:00Z',
        guid: 'test-guid',
        updated_at: '2023-01-01T00:00:00Z',
        url: '/v2/user_provided_service_instances/test-guid'
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
