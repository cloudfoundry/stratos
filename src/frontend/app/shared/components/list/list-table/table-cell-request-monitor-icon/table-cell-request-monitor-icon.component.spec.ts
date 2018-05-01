import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRequestMonitorIconComponent } from './table-cell-request-monitor-icon.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('TableCellRequestMonitorIconComponent', () => {
  let component: TableCellRequestMonitorIconComponent<any>;
  let fixture: ComponentFixture<TableCellRequestMonitorIconComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellRequestMonitorIconComponent],
      imports: BaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRequestMonitorIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
