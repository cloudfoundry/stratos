import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { CoreModule } from '../../../../../../core/core.module';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name.component';

describe('TableCellEndpointNameComponent', () => {
  let component: TableCellEndpointNameComponent;
  let fixture: ComponentFixture<TableCellEndpointNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEndpointNameComponent],
      imports: [CoreModule]
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
