import { Component, Input, OnInit, Type, OnDestroy, ViewChild } from '@angular/core';
import { ITableDataSource } from '../../data-sources/table-data-source';
import { ITableColumn, ITableText } from '../table/table.component';
import { NgForm, NgModel } from '@angular/forms';
import { ListView, SetListViewAction, ListFilter, SetListFilterAction, ListPagination, SetListPaginationAction } from '../../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { MdPaginator, PageEvent } from '@angular/material';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent<T> implements OnInit, OnDestroy {
  private uberSub: Subscription;

  @Input('dataSource') dataSource = null as ITableDataSource<T>;
  @Input('columns') columns = null as ITableColumn<T>[];
  @Input('text') text = null as ITableText;
  @Input('enableFilter') enableFilter = false;
  @Input('tableFixedRowHeight') tableFixedRowHeight = false;

  @Input('cardComponent') cardComponent: Type<{}>;
  @Input('addForm') addForm: NgForm;

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: NgModel;

  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(private _store: Store<AppState>) { }

  ngOnInit() {

    const paginationStoreToWidget = this.dataSource.listPagination$.do((pagination: ListPagination) => {
      this.paginator.length = pagination.totalResults;
      this.paginator.pageIndex = pagination.pageIndex;
      this.paginator.pageSize = pagination.pageSize;
      this.paginator.pageSizeOptions = pagination.pageSizeOptions;
    });

    const paginationWidgetToStore = this.paginator.page.do((page: PageEvent) => {
      this._store.dispatch(new SetListPaginationAction(
        this.dataSource.listStateKey,
        {
          pageSize: page.pageSize,
          pageIndex: page.pageIndex,
        }
      ));
    });

    const filterStoreToWidget = this.dataSource.listFilter$.do((filter: ListFilter) => {
      this.filter.model = filter.filter;
    });

    const filterWidgeToStore = this.filter.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .map(value => value as string)
      .do((stFilter: string) => {
        this._store.dispatch(new SetListFilterAction(
          this.dataSource.listStateKey,
          {
            filter: stFilter
          }
        ));
      });

    this.uberSub = Observable.combineLatest(
      paginationStoreToWidget,
      paginationWidgetToStore,
      filterStoreToWidget,
      filterWidgeToStore
    ).subscribe();

    this.dataSource.connect();
  }

  ngOnDestroy() {
    this.uberSub.unsubscribe();
  }

  updateListView(listView: ListView) {
    this._store.dispatch(new SetListViewAction(this.dataSource.listStateKey, listView));
  }

}
