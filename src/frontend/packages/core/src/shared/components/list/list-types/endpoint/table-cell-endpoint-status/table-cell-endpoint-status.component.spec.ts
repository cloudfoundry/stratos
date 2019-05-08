import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { CoreModule } from '../../../../../../core/core.module';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status.component';

describe('TableCellEndpointStatusComponent', () => {
  let component: TableCellEndpointStatusComponent;
  let fixture: ComponentFixture<TableCellEndpointStatusComponent>;

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
