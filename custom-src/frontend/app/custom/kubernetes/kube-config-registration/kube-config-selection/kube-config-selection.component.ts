import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import { HideSnackBar, ShowSnackBar } from '../../../../../../store/src/actions/snackBar.actions';
import { AppState } from '../../../../../../store/src/app-state';
import {
  TableHeaderSelectComponent,
} from '../../../../shared/components/list/list-table/table-header-select/table-header-select.component';
import { KubeConfigHelper } from '../kube-config.helper';
import { KubeConfigFileCluster } from '../kube-config.types';
import {
  ITableListDataSource,
  RowState,
} from './../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from './../../../../shared/components/list/list-table/table.types';
import { KubeConfigTableCertComponent } from './kube-config-table-cert/kube-config-table-cert.component';
import { KubeConfigTableName } from './kube-config-table-name/kube-config-table-name.component';
import { KubeConfigTableSelectComponent } from './kube-config-table-select/kube-config-table-select.component';
import {
  KubeConfigTableSubTypeSelectComponent,
} from './kube-config-table-sub-type-select/kube-config-table-sub-type-select.component';
import { KubeConfigTableUserSelectComponent } from './kube-config-table-user-select/kube-config-table-user-select.component';

export interface KubeConfigTableListDataSource extends ITableListDataSource<KubeConfigFileCluster> {
  editRowName: string;
}

@Component({
  selector: 'app-kube-config-selection',
  templateUrl: './kube-config-selection.component.html',
  styleUrls: ['./kube-config-selection.component.scss'],
  providers: [
    KubeConfigHelper
  ],
})
export class KubeConfigSelectionComponent {

  @Input() applyStarted: boolean;
  public dataSource: KubeConfigTableListDataSource = {
    connect: () => this.helper.clusters$,
    disconnect: () => { },
    trackBy: (index, row) => row.name,
    isTableLoading$: observableOf(false),
    getRowState: (row: KubeConfigFileCluster, schemaKey: string): Observable<RowState> => {
      return row ? row._state.asObservable() : observableOf({});
    },
    selectAllIndeterminate: false,
    selectAllChecked: false,
    selectAllFilteredRows: () => {
      // Should always go to true from indeterminate
      this.dataSource.selectAllChecked = this.dataSource.selectAllIndeterminate ? true : !this.dataSource.selectAllChecked
      this.dataSource.selectAllIndeterminate = false; // either all off or all on, cannot be indeterminate

      this.helper.clusters$.pipe(
        first(),
        switchMap(clusters => combineLatest(clusters.map(cluster => {
          if (!cluster._invalid) {
            cluster._selected = this.dataSource.selectAllChecked;
            return this.helper.checkValidity(cluster).pipe(map(() => cluster));
          }
          return of(cluster);
        }))),
        first(),
      ).subscribe(clusters => {
        this.checkCanGoNext(clusters);
      })
    },
    editRow: null,
    editRowName: null,
    startEdit: (c: KubeConfigFileCluster) => {
      this.dataSource.editRow = c;
    },
    saveEdit: () => {
      this.dataSource.editRow.name = this.dataSource.editRowName;
      this.helper.update(this.dataSource.editRow);
      delete this.dataSource.editRowName;
      delete this.dataSource.editRow;
    },
    cancelEdit: () => {
      delete this.dataSource.editRowName;
      delete this.dataSource.editRow;
    },
    getRowUniqueId: (c: KubeConfigFileCluster) => c ? c._id : null
  };

  public columns: ITableColumn<KubeConfigFileCluster>[] = [
    {
      columnId: 'select',
      headerCellComponent: TableHeaderSelectComponent,
      cellComponent: KubeConfigTableSelectComponent,
      class: 'table-column-select',
      cellFlex: '0 0 48px'
    },
    {
      columnId: 'name', headerCell: () => 'Name',
      cellComponent: KubeConfigTableName,
      cellFlex: '3',
      class: 'app-table__cell--table-no-v-padding'
    },
    {
      columnId: 'url', headerCell: () => 'URL',
      cellDefinition: {
        valuePath: 'cluster.server'
      },
      cellFlex: '4',
    },
    {
      columnId: 'type', headerCell: () => 'Type',
      cellFlex: '1',
      cellComponent: KubeConfigTableSubTypeSelectComponent
    },
    {
      columnId: 'user', headerCell: () => 'User',
      cellFlex: '4',
      cellComponent: KubeConfigTableUserSelectComponent
    },
    {
      columnId: 'cert', headerCell: () => 'Skip SSL Validation',
      cellFlex: '0 0 62px',
      class: 'app-table__cell--table-centred',
      cellComponent: KubeConfigTableCertComponent
    }
  ];

  // Is the import data valid?
  valid = new BehaviorSubject<boolean>(false);
  valid$ = this.valid.asObservable();

  canSetIntermediate = false;

  constructor(
    private store: Store<AppState>,
    public helper: KubeConfigHelper
  ) {
    this.helper.clustersChanged = () => this.clustersChanged()
  }

  // Save data for the next step to know the list of clusters to import
  onNext = () => this.helper.clusters$.pipe(
    first(),
    map(clusters => ({
      success: true,
      data: clusters
    }))
  )

  clustersParse(cluster: string) {
    this.store.dispatch(new HideSnackBar());
    this.helper.parse(cluster).pipe(first()).subscribe(errorString => {
      if (errorString) {
        this.store.dispatch(new ShowSnackBar(`Failed to load Kube Config: ${errorString}`, 'Close'))
      }
    })
  }

  onEnter = () => {
    if (!this.applyStarted) {
      return;
    }
    // Handle back from review step (ensure newly registered endpoints are taken into account)
    this.helper.updateAll().pipe(first()).subscribe(() => { })
  }

  // Row changed event - update the next button and selection state
  clustersChanged() {
    this.helper.clusters$.pipe(
      first()
    ).subscribe(clusters => {
      this.checkCanGoNext(clusters);

      // Check the select all state
      let selectedCount = 0;
      let totalCount = 0;
      clusters.forEach(i => {
        if (!i._invalid) {
          totalCount++;
          selectedCount += i._selected ? 1 : 0;
        }
      });

      if (selectedCount === 0 || totalCount === selectedCount) {
        this.dataSource.selectAllIndeterminate = false;
        this.dataSource.selectAllChecked = (selectedCount !== 0);
      } else {
        this.dataSource.selectAllIndeterminate = true;
      }
    })

  }

  // Can we proceed?
  checkCanGoNext(clusters: KubeConfigFileCluster[]) {
    let selected = 0;
    let okay = 0;
    clusters.forEach(i => {
      if (i._selected) {
        selected++;
        if (!i._invalid) {
          okay++;
        }
      }
    });

    // Must be at least one selected and they all must be okay to import
    this.valid.next(selected > 0 && selected === okay);
  }

}
