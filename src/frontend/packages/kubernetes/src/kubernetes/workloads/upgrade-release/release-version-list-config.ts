import { signal, WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { format, formatDistance } from 'date-fns';
import { Observable, of } from 'rxjs';
import { take,  } from 'rxjs/operators';

import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  TableCellRadioComponent,
} from '../../../../../core/src/shared/components/list/list-table/table-cell-radio/table-cell-radio.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import {
  defaultPaginationPageSizeOptionsTable,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IMultiListAction,
  ListViewTypes,
} from '../../../../../core/src/shared/components/list/list.component.types';
import { MonocularVersion } from '../../../helm/store/helm.types';
import { HelmReleaseVersionsDataSource } from './release-version-data-source';

const typeFilterKey = 'versionType';

// Helper function to create a signal wrapper compatible with IListMultiFilterConfig
// The wrapper provides BehaviorSubject-like API (.next, .getValue, .asObservable)
// while being backed by a Signal
function createSignalWrapper<T>(initialValue: T) {
  const _signal = signal<T>(initialValue);
  const wrapper = Object.assign(
    // Make it callable like a signal
    () => _signal(),
    {
      // WritableSignal methods
      set: (value: T) => _signal.set(value),
      update: (fn: (value: T) => T) => _signal.update(fn),
      asReadonly: () => _signal.asReadonly(),
      // BehaviorSubject compatibility methods
      next: (value: T) => _signal.set(value),
      getValue: () => _signal(),
      asObservable: () => toObservable(_signal),
    }
  );
  return wrapper as WritableSignal<T> & {
    next: (value: T) => void;
    getValue: () => T;
    asObservable: () => Observable<T>;
  };
}

export class ReleaseUpgradeVersionsListConfig implements IListConfig<MonocularVersion> {

  public versionsDataSource: ListDataSource<MonocularVersion>;

  private multiFiltersConfigs: IListMultiFilterConfig[];

  getGlobalActions: () => IGlobalListAction<any>[];
  getMultiActions: () => IMultiListAction<any>[];
  getSingleActions: () => IListAction<any>[];

  columns: Array<ITableColumn<MonocularVersion>> = [
    {
      columnId: 'radio',
      headerCell: () => '',
      cellComponent: TableCellRadioComponent,
      class: 'table-column-select',
      cellFlex: '0 0 60px'
    },
    {
      columnId: 'version',
      headerCell: () => 'Version',
      cellFlex: '2',
      cellDefinition: {
        valuePath: 'attributes.version'
      }
    },
    {
      columnId: 'created',
      headerCell: () => 'Created',
      cellFlex: '3',
      cellDefinition: {
        getValue: row => format(new Date(row.attributes.created), 'PPPppp')
      }
    },
    {
      columnId: 'age',
      headerCell: () => 'Age',
      cellFlex: '2',
      cellDefinition: {
        getValue: row => formatDistance(new Date(row.attributes.created), new Date())
      }
    },
  ];
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  viewType = ListViewTypes.TABLE_ONLY;

  hideRefresh = true;

  getColumns = () => this.columns;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => this.multiFiltersConfigs;

  getDataSource = () => this.versionsDataSource;

  constructor(
    store: Store<any>,
    repoName: string,
    chartName: string,
    version: string,
    monocularEndpoint: string
  ) {
    this.getGlobalActions = () => [];
    this.getMultiActions = () => [];
    this.getSingleActions = () => [];

    this.versionsDataSource = new HelmReleaseVersionsDataSource(store, this, repoName, chartName, version, monocularEndpoint);

    this.multiFiltersConfigs = [{
      hideAllOption: true,
      autoSelectFirst: true,
      key: typeFilterKey,
      label: 'Endpoint Type',
      list$: of([
        {
          label: 'Release Versions',
          item: {},
          value: 'release'
        },
        {
          label: 'All Versions',
          item: {},
          value: 'all'
        }
      ]),
      loading$: of(false),
      select: createSignalWrapper<any>(undefined)
    }];

    // Auto-select first non-development version
    setTimeout(() => {
      this.versionsDataSource.page$.pipe(take(1)).subscribe(rs => {
        if (rs && rs.length > 0) {
          this.versionsDataSource.selectedRowToggle(this.getFirstNonDevelopmentVersion(rs), false);
        }
      });
    }, 0);
  }

  // Get the first version that is a non-development version (no hypen in the version number)
  private getFirstNonDevelopmentVersion(rows: MonocularVersion[]): MonocularVersion {
    for (const mv of rows) {
      if (mv.attributes.version.indexOf('-') === -1) {
        return mv;
      }
    }
    return rows[0];
  }

}
