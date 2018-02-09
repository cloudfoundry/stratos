import { CoreModule } from '../../../../../../core/core.module';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status.component';

describe('TableCellEndpointStatusComponent', () => {
  let component: TableCellEndpointStatusComponent<EndpointModel>;
  let fixture: ComponentFixture<TableCellEndpointStatusComponent<EndpointModel>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEndpointStatusComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointStatusComponent);
    component = fixture.componentInstance;
    component.row = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
