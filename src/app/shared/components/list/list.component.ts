import { Component, Input, OnInit, Type } from '@angular/core';
import { ITableDataSource } from '../../data-sources/table-data-source';
import { ITableColumn, ITableText } from '../table/table.component';
import { NgForm } from '@angular/forms';
import { ListView, SetListViewAction } from '../../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent<T> implements OnInit {

  @Input('dataSource') dataSource = null as ITableDataSource<T>;
  @Input('columns') columns = null as ITableColumn<T>[];
  @Input('text') text = null as ITableText;
  @Input('enableFilter') enableFilter = false;
  @Input('tableFixedRowHeight') tableFixedRowHeight = false;

  @Input('cardComponent') cardComponent: Type<{}>;
  @Input('addForm') addForm: NgForm;
  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
  }

  updateListView(listView: ListView) {
    console.log(listView);
    this.store.dispatch(new SetListViewAction(this.dataSource.listStateKey, listView));
  }

}
