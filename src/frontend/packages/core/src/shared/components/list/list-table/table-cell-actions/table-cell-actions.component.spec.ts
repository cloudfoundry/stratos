import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from "@test-framework/core-test.helper";
import { of as observableOf } from 'rxjs';
import type { APIResource } from '@stratosui/store';
import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../../../core/core.module';
import type { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { ListConfig } from '../../list.component.types';
import { TableCellActionsComponent } from './table-cell-actions.component';

describe('TableCellActionsComponent', () => {
  let component: TableCellActionsComponent<APIResource>;
  let fixture: ComponentFixture<TableCellActionsComponent<APIResource>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        ListConfig,
        provideZonelessChangeDetection(),
      ],
      imports: [
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
        TableCellActionsComponent,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellActionsComponent<APIResource<unknown>>>(TableCellActionsComponent);
    component = fixture.componentInstance;
    component.dataSource = {
    } as IListDataSource<APIResource>;
    component.rowState = observableOf({});
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
