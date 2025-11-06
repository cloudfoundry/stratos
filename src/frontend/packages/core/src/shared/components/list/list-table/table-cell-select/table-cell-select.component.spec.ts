import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/core.module';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellSelectComponent } from './table-cell-select.component';
import { of as observableOf } from 'rxjs';

describe('TableCellSelectComponent', () => {
  let component: TableCellSelectComponent<any>;
  let fixture: ComponentFixture<TableCellSelectComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        CoreModule,
        TableCellSelectComponent
      ]
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSelectComponent);
    component = fixture.componentInstance;
    component.row = {};
    component.rowState = observableOf({});
    component.dataSource = {} as IListDataSource<any>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
