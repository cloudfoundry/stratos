import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, first, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { selectApplicationSource } from '../../../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import { DeployApplicationSource } from '../../../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { GitSCMService, GitSCMType } from '../../../../data-services/scm/scm.service';
import { TableCellRadioComponent } from '../../list-table/table-cell-radio/table-cell-radio.component';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';

@Injectable()
export class GithubCommitsListConfigServiceDeploy extends GithubCommitsListConfigServiceBase {
  constructor(
    store: Store<CFAppState>,
    datePipe: DatePipe,
    scmService: GitSCMService
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
      map((appSource: DeployApplicationSource) => {
        return (appSource.type.id === 'github' || appSource.type.id === 'gitlab') ? {
          scm: appSource.type.id as GitSCMType,
          projectName: appSource.gitDetails.projectName,
          sha: appSource.gitDetails.branch.name,
          commitSha: appSource.gitDetails.commit ? appSource.gitDetails.commit : null
        } : null;
      }),
      filter(fetchDetails => !!fetchDetails && !!fetchDetails.projectName && !!fetchDetails.sha),
      first()
    ).subscribe(fetchDetails => {
      const scm = scmService.getSCM(fetchDetails.scm);
      this.dataSource = new GithubCommitsDataSource(this.store,
        this, scm, fetchDetails.projectName, fetchDetails.sha, fetchDetails.commitSha);
      this.initialised.next(true);
    });
  }
}
