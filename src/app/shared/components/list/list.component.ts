import { Component, Input, OnInit, Type, OnDestroy, ViewChild } from '@angular/core';
import { ITableDataSource } from '../../data-sources/table-data-source';
import { ITableColumn, ITableText } from '../table/table.component';
import { NgForm, NgModel } from '@angular/forms';
import { ListView, SetListViewAction, ListFilter, SetListFilterAction } from '../../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

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

  @ViewChild('filter') filter: NgModel;

  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(private _store: Store<AppState>) { }

  ngOnInit() {
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
      filterStoreToWidget,
      filterWidgeToStore
    ).subscribe();
  }

  ngOnDestroy() {
    this.uberSub.unsubscribe();
  }

  updateListView(listView: ListView) {
    this._store.dispatch(new SetListViewAction(this.dataSource.listStateKey, listView));
  }

}
