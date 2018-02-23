import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceInstanceTagsComponent } from './table-cell-service-instance-tags.component';

describe('TableCellServiceInstanceTagsComponent', () => {
  let component: TableCellServiceInstanceTagsComponent;
  let fixture: ComponentFixture<TableCellServiceInstanceTagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceInstanceTagsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceInstanceTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
