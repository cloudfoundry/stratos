import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import { CoreModule } from '../../../../../core/core.module';
import { APIResource } from '../../../../../store/types/api.types';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { ListConfig } from '../../list.component.types';
import { TableCellAsyncComponent } from './table-cell-async.component';

describe('TableCellAsyncComponent', () => {
  let component: TableCellAsyncComponent<any>;
  let fixture: ComponentFixture<TableCellAsyncComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ListConfig
      ],
      declarations: [TableCellAsyncComponent],
      imports: [
        CoreModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAsyncComponent);
    component = fixture.componentInstance;
    component.dataSource = {
    } as IListDataSource<APIResource>;
    component.rowState = observableOf({});
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
