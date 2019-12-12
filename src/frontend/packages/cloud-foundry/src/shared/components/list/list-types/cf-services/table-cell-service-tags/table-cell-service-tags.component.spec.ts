import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceTagsComponent } from './table-cell-service-tags.component';

describe('TableCellServiceTagsComponent', () => {
  let component: TableCellServiceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceTagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceTagsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
