import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRouteComponent } from './table-cell-route.component';
import { EntityInfo } from '../../../../../../store/types/api.types';
import { SharedModule } from '../../../../../shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';

describe('TableCellRouteComponent', () => {
  let component: TableCellRouteComponent<any>;
  let fixture: ComponentFixture<TableCellRouteComponent<any>>;

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
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
