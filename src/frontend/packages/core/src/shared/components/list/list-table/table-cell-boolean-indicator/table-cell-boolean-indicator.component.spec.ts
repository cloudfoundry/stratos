import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/core-test.helper';
import { BooleanIndicatorComponent } from '../../../boolean-indicator/boolean-indicator.component';
import { TableCellBooleanIndicatorComponent } from './table-cell-boolean-indicator.component';


describe('TableCellBooleanIndicatorComponent', () => {
  let component: TableCellBooleanIndicatorComponent;
  let fixture: ComponentFixture<TableCellBooleanIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModulesNoShared,
        TableCellBooleanIndicatorComponent,
        BooleanIndicatorComponent
      ]
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellBooleanIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
