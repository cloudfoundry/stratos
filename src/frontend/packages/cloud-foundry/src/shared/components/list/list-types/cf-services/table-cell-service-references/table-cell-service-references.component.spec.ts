import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceReferencesComponent } from './table-cell-service-references.component';

describe('TableCellServiceReferencesComponent', () => {
  let component: TableCellServiceReferencesComponent;
  let fixture: ComponentFixture<TableCellServiceReferencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceReferencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceReferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
