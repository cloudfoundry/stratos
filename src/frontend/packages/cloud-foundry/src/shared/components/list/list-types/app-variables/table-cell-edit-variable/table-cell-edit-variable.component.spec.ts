import type { ListAppEnvVar } from '../cf-app-variables-data-source';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellEditVariableComponent } from './table-cell-edit-variable.component';
import type { IListDataSource } from '@stratosui/core';

describe('TableCellEditVariableComponent', () => {
  let component: TableCellEditVariableComponent;
  let fixture: ComponentFixture<TableCellEditVariableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
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
