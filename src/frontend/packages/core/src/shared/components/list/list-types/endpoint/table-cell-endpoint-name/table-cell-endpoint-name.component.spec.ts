import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityMonitorFactory } from '@stratosui/store';
import { EndpointModel } from '@stratosui/store';
import { BaseTestModules } from '../../../../../../../test-framework/core-test.helper';
import { CoreModule } from '../../../../../../core/core.module';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';

describe('TableCellEndpointNameComponent', () => {
  let component: TableCellEndpointNameComponent;
  let fixture: ComponentFixture<TableCellEndpointNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        ...BaseTestModules,
      ],
      providers: [
        EntityMonitorFactory,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointNameComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: ''
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
