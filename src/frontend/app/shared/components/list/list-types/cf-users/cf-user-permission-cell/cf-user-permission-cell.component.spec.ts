import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellCfUserPermissionComponent } from './cf-user-permission-cell.component';

describe('CfUserPermissionCellComponent', () => {
  let component: TableCellCfUserPermissionComponent;
  let fixture: ComponentFixture<TableCellCfUserPermissionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellCfUserPermissionComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellCfUserPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
