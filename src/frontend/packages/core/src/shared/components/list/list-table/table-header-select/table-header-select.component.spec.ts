import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TableHeaderSelectComponent } from './table-header-select.component';
import { CoreModule } from '../../../../../core/core.module';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';

describe('TableHeaderSelectComponent', () => {
  let component: TableHeaderSelectComponent<any>;
  let fixture: ComponentFixture<TableHeaderSelectComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      providers: [provideZonelessChangeDetection()],
      
      imports: [
        CoreModule,
        TableHeaderSelectComponent,
      ]
    
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableHeaderSelectComponent);
    component = fixture.componentInstance;
    component.dataSource = {} as IListDataSource<any>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
