import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
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
