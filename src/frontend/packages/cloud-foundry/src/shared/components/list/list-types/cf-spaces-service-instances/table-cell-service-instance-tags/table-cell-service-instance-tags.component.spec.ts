import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { TableCellServiceInstanceTagsComponent } from './table-cell-service-instance-tags.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
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
        active: true,
        bindable: true,
        description: 'test',
        extra: '',
        label: '',
        info_url: '',
        long_description: '',
        plan_updateable: false,
        tags: [],
        url: '',
        version: '',
        service_instance: {
          entity: {
            tags: []
          }
        }
      },
      metadata: {
        created_at: '',
        guid: '',
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
