import { ListAppEnvVar } from '../cf-app-variables-data-source';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellEditVariableComponent } from './table-cell-edit-variable.component';
import { IListDataSource } from '../../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';

describe('TableCellEditVariableComponent', () => {
  let component: TableCellEditVariableComponent;
  let fixture: ComponentFixture<TableCellEditVariableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellEditVariableComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellEditVariableComponent);
    component = fixture.componentInstance;
    component.row = {
      name: 'name',
      value: 'value'
    };
    component.dataSource = {} as IListDataSource<ListAppEnvVar>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
