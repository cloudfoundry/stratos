import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { of as observableOf } from 'rxjs';

import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CoreTestingModule } from '../../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../../core/core.module';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { ListConfig } from '../../list.component.types';
import { TableCellActionsComponent } from './table-cell-actions.component';

describe('TableCellActionsComponent', () => {
  let component: TableCellActionsComponent<any>;
  let fixture: ComponentFixture<TableCellActionsComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        ListConfig
      ],
      imports: [
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
        TableCellActionsComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellActionsComponent);
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
