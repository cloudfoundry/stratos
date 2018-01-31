import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellTCPRouteComponent } from './table-cell-tcproute.component';
import { CoreModule } from '../../../../../core/core.module';
import { EntityInfo } from '../../../../../store/types/api.types';

describe('TableCellTCPRouteComponent', () => {
  let component: TableCellTCPRouteComponent<any>;
  let fixture: ComponentFixture<TableCellTCPRouteComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellTCPRouteComponent ],
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
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
