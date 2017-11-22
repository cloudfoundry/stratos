import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppNameComponent } from './table-cell-app-name.component';

describe('TableCellAppNameComponent', () => {
  let component: TableCellAppNameComponent;
  let fixture: ComponentFixture<TableCellAppNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellAppNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
