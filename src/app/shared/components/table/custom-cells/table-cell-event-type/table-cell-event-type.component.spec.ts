import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventTypeComponent } from './table-cell-event-type.component';

describe('TableCellEventTypeComponent', () => {
  let component: TableCellEventTypeComponent;
  let fixture: ComponentFixture<TableCellEventTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEventTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
