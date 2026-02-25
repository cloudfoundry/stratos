import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { endpointEntityType, stratosEntityFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppMonitorComponentTypes } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';
import { TableCellRequestMonitorIconComponent } from './table-cell-request-monitor-icon.component';

describe('TableCellRequestMonitorIconComponent', () => {
  let component: TableCellRequestMonitorIconComponent;
  let fixture: ComponentFixture<TableCellRequestMonitorIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection()
      ],
      imports: [
        TableCellRequestMonitorIconComponent
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRequestMonitorIconComponent);
    component = fixture.componentInstance;
    component.id = '1';
    component.config = {
      getConfig: () => ({
        entityKey: '',
        schema: stratosEntityFactory(endpointEntityType),
        monitorState: AppMonitorComponentTypes.DELETE,
      }),
    };
    component.row = {
      metadata: {
        guid: '1'
      }
    };
    // Don't call detectChanges() yet - component needs inputs set first
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
