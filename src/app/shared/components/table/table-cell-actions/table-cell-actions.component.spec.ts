import { DatePipe } from '@angular/common';
import { APIResource } from '../../../../store/types/api.types';
import { CoreModule } from '../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellActionsComponent } from './table-cell-actions.component';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ListActions, IListDataSource } from '../../../data-sources/list=data-source-types';
import { ListConfig } from '../../list/list.component';

describe('TableCellActionsComponent', () => {
  let component: TableCellActionsComponent<any>;
  let fixture: ComponentFixture<TableCellActionsComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ListConfig
      ],
      declarations: [TableCellActionsComponent],
      imports: [
        CoreModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellActionsComponent);
    component = fixture.componentInstance;
    component.dataSource = {
    } as IListDataSource<APIResource>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
