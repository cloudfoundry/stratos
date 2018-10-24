import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppState } from '../../../../../store/app-state';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';
import { selectPEProjectName, selectApplicationSource } from '../../../../../store/selectors/deploy-application.selector';
import { first, filter, map } from 'rxjs/operators';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { TableCellRadioComponent } from '../../list-table/table-cell-radio/table-cell-radio.component';
import { DeployApplicationSource } from '../../../../../store/types/deploy-application.types';

@Injectable()
export class GithubCommitsListConfigServiceDeploy extends GithubCommitsListConfigServiceBase {
  constructor(
    store: Store<AppState>,
    datePipe: DatePipe,
  ) {
    super(store, datePipe);
    this.text.title = 'Select a commit';
    this.columns.unshift({
      columnId: 'radio',
      headerCell: () => '',
      cellComponent: TableCellRadioComponent,
      class: 'table-column-select',
      cellFlex: '1'
    });

    this.store.select<DeployApplicationSource>(selectApplicationSource).pipe(
      map((appSource: DeployApplicationSource) => appSource.type.id === 'github' ? {
        projectName: appSource.projectName,
        sha: appSource.branch.name,
        commitSha: appSource.commit ? appSource.commit.sha : null
      } : null),
      filter(fetchDetails => !!fetchDetails && !!fetchDetails.projectName && !!fetchDetails.sha),
      first()
    ).subscribe(fetchDetails => {
      this.dataSource = new GithubCommitsDataSource(this.store, this, fetchDetails.projectName, fetchDetails.sha, fetchDetails.commitSha);
      this.initialised.next(true);
    });
  }
}
