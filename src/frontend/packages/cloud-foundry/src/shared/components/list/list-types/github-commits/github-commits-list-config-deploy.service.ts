import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@stratosui/store';
import { GithubCommitsDataSource, GithubCommitsListConfigServiceBase, GitSCMService, GitSCMType } from '@stratosui/git';
import { take, filter, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { CfDeployAppDataService } from '../../../../../../../cloud-foundry/src/services/domain-data/cf-deploy-app-data.service';
import {
  TableCellRadioComponent } from '../../../../../../../core/src/shared/components/list/list-table/table-cell-radio/table-cell-radio.component';


@Injectable({
  providedIn: 'root'
})
export class GithubCommitsListConfigServiceDeploy extends GithubCommitsListConfigServiceBase {
  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const scmService = inject(GitSCMService);
    const deployData = inject(CfDeployAppDataService);

    super();
    this.text.title = 'Select a commit';
    this.columns.unshift({
      columnId: 'radio',
      headerCell: () => '',
      cellComponent: TableCellRadioComponent,
      class: 'table-column-select',
      cellFlex: '0 0 60px'
    });

    toObservable(deployData.applicationSource).pipe(
      map(appSource => (appSource?.type?.id === 'github' || appSource?.type?.id === 'gitlab') ? {
        scm: appSource.type.id as GitSCMType,
        accessToken: appSource.gitDetails?.accessToken,
        projectName: appSource.gitDetails?.projectName,
        sha: appSource.gitDetails?.branch?.name,
        endpointGuid: appSource.gitDetails?.endpointGuid,
      } : null),
      filter(fetchDetails => !!fetchDetails && !!fetchDetails.projectName && !!fetchDetails.sha),
      take(1),
    ).subscribe(fetchDetails => {
      const scm = scmService.getSCM(fetchDetails.scm, fetchDetails.endpointGuid, fetchDetails.accessToken);
      this.dataSource = new GithubCommitsDataSource(this.store, this, scm, fetchDetails.projectName, fetchDetails.sha);
      this.initialised.next(true);

      // Auto-select first commit - wait for page to load, select first item if present
      setTimeout(() => {
        this.dataSource.page$.pipe(
          take(1)
        ).subscribe(rs => {
          if (rs && rs.length > 0) {
            this.dataSource.selectedRowToggle(rs[0], false);
          }
        });
      }, 0);
    });
  }
}
