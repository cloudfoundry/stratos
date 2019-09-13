import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { CoreTestingModule } from '../../../../../../../test-framework/core-test.modules';
import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../../../core/core.module';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';
import { CFBaseTestModules } from '../../../../../../../../cloud-foundry/test-framework/cf-test-helper';

describe('TableCellEndpointNameComponent', () => {
  let component: TableCellEndpointNameComponent;
  let fixture: ComponentFixture<TableCellEndpointNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEndpointNameComponent],
      imports: [
        CoreModule,
        CoreTestingModule,
        // createBasicStoreModule(),
        ...CFBaseTestModules
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
    component.row = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
