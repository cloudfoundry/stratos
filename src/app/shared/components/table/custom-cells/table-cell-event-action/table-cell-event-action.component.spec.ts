import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventActionComponent } from './table-cell-event-action.component';

describe('TableCellEventActionComponent', () => {
  let component: TableCellEventActionComponent;
  let fixture: ComponentFixture<TableCellEventActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEventActionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
