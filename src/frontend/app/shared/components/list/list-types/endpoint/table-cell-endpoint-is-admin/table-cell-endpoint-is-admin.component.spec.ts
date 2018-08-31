import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/core.module';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { TableCellEndpointIsAdminComponent } from './table-cell-endpoint-is-admin.component';


describe('TableCellEndpointIsAdminComponent', () => {
  let component: TableCellEndpointIsAdminComponent<{}>;
  let fixture: ComponentFixture<TableCellEndpointIsAdminComponent<{}>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEndpointIsAdminComponent, BooleanIndicatorComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointIsAdminComponent);
    component = fixture.componentInstance;
    component.row = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
