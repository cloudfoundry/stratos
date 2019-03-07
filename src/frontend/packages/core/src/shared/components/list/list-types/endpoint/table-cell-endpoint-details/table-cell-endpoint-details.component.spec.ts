import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEndpointDetailsComponent } from './table-cell-endpoint-details.component';

describe('TableCellEndpointDetailsComponent', () => {
  let component: TableCellEndpointDetailsComponent;
  let fixture: ComponentFixture<TableCellEndpointDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellEndpointDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
