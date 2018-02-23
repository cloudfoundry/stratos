import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellServiceInstanceAppsAttachedComponent } from './table-cell-service-instance-apps-attached.component';

describe('TableCellServiceInstanceAppsAttachedComponent', () => {
  let component: TableCellServiceInstanceAppsAttachedComponent;
  let fixture: ComponentFixture<TableCellServiceInstanceAppsAttachedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellServiceInstanceAppsAttachedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceInstanceAppsAttachedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
