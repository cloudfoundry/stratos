import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../../../core/core.module';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';

describe('TableCellEndpointNameComponent', () => {
  let component: TableCellEndpointNameComponent;
  let fixture: ComponentFixture<TableCellEndpointNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEndpointNameComponent],
      imports: [
        CoreModule,
        createBasicStoreModule()
      ],
      providers: [EntityMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointNameComponent);
    component = fixture.componentInstance;
    component.row = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
