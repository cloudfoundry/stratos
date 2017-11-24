import { APIResource } from '../../../../store/types/api.types';
import { CoreModule } from '../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellActionsComponent } from './table-cell-actions.component';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { IListDataSource, ListActions } from '../../../data-sources/list-data-source';

describe('TableCellActionsComponent', () => {
  let component: TableCellActionsComponent<any>;
  let fixture: ComponentFixture<TableCellActionsComponent<any>>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellActionsComponent],
      imports: [
        CoreModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          })
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellActionsComponent);
    component = fixture.componentInstance;
    component.dataSource = {
      actions: new ListActions<APIResource>(),
    } as IListDataSource<APIResource>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
