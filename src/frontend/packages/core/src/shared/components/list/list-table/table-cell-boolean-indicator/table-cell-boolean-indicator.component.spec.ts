import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/core-test.helper';
import { BooleanIndicatorComponent } from '../../../boolean-indicator/boolean-indicator.component';
import { TableCellBooleanIndicatorComponent } from './table-cell-boolean-indicator.component';


describe('TableCellBooleanIndicatorComponent', () => {
  let component: TableCellBooleanIndicatorComponent;
  let fixture: ComponentFixture<TableCellBooleanIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellBooleanIndicatorComponent, BooleanIndicatorComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellBooleanIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
