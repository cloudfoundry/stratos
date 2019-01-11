import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/core.module';
import { APIResource } from '../../../../../../store/types/api.types';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';
import { ListCfRoute } from '../cf-routes-data-source-base';
import { TableCellTCPRouteComponent } from './table-cell-tcproute.component';

describe('TableCellTCPRouteComponent', () => {
  let component: TableCellTCPRouteComponent;
  let fixture: ComponentFixture<TableCellTCPRouteComponent>;


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellTCPRouteComponent, BooleanIndicatorComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellTCPRouteComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    } as APIResource<ListCfRoute>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
