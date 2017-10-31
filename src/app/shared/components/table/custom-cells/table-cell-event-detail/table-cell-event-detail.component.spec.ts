import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEventDetailComponent } from './table-cell-event-detail.component';

describe('TableCellEventDetailComponent', () => {
  let component: TableCellEventDetailComponent;
  let fixture: ComponentFixture<TableCellEventDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEventDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
