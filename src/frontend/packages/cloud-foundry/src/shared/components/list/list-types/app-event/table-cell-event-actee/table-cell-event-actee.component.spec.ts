import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventActeeComponent } from './table-cell-event-actee.component';

describe('TableCellEventActeeComponent', () => {
  let component: TableCellEventActeeComponent;
  let fixture: ComponentFixture<TableCellEventActeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEventActeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventActeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
