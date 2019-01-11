import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { APIResource } from '../../../../../../store/types/api.types';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ListCfRoute } from '../cf-routes-data-source-base';
import { TableCellRouteComponent } from './table-cell-route.component';

describe('TableCellRouteComponent', () => {
  let component: TableCellRouteComponent;
  let fixture: ComponentFixture<TableCellRouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellRouteComponent],
      imports: [
        RouterTestingModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRouteComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        domain: {
          entity: {
            name: 'test'
          }
        }
      }
    } as APIResource<ListCfRoute>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
