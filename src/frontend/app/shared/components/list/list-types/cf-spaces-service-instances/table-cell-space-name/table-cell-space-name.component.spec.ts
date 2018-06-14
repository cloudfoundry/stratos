import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellSpaceNameComponent } from './table-cell-space-name.component';

describe('TableCellSpaceNameComponent', () => {
  let component: TableCellSpaceNameComponent<any>;
  let fixture: ComponentFixture<TableCellSpaceNameComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellSpaceNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSpaceNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
