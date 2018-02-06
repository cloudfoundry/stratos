import { CoreModule } from '../../../../../../core/core.module';
import { CNSISModel } from '../../../../../../store/types/cnsis.types';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status.component';

describe('TableCellEndpointStatusComponent', () => {
  let component: TableCellEndpointStatusComponent<CNSISModel>;
  let fixture: ComponentFixture<TableCellEndpointStatusComponent<CNSISModel>>;

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
    component.row = {} as CNSISModel;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
