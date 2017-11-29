import { APIResource } from '../../../../store/types/api.types';
import { CoreModule } from '../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellActionsComponent } from './table-cell-actions.component';
import { IListDataSource, ListActions } from '../../../data-sources/list-data-source';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';

describe('TableCellActionsComponent', () => {
  let component: TableCellActionsComponent<any>;
  let fixture: ComponentFixture<TableCellActionsComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
      actions: new ListActions<APIResource>(),
    } as IListDataSource<APIResource>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
