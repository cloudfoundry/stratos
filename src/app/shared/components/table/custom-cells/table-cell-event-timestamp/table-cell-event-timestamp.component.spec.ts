import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventTimestampComponent } from './table-cell-event-timestamp.component';

describe('TableCellEventTimestampComponent', () => {
  let component: TableCellEventTimestampComponent;
  let fixture: ComponentFixture<TableCellEventTimestampComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEventTimestampComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventTimestampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
