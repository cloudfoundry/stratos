import { GitSCMType } from './../../../../../../shared/data-services/scm/scm.service';
import { GitHubSCM } from './../../../../../../shared/data-services/scm/github-scm';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { combineLatest, distinct, map, tap } from 'rxjs/operators';

import { EntityInfo } from '../../../../../../store/types/api.types';
import { AppSummary } from '../../../../../../store/types/app-metadata.types';
import { getFullEndpointApiUrl } from '../../../../../endpoints/endpoint-helpers';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';
import { GitSCMService } from '../../../../../../shared/data-services/scm/scm.service';


@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  providers: [
    ApplicationMonitorService,
  ]
})
export class BuildTabComponent implements OnInit {


  constructor(public applicationService: ApplicationService, private scmService: GitSCMService) { }

  cardTwoFetching$: Observable<boolean>;

  public async: any;

  getFullApiUrl = getFullEndpointApiUrl;

  sshStatus$: Observable<string>;

  deploySource$: Observable<any>;

  ngOnInit() {
    this.cardTwoFetching$ = this.applicationService.application$.pipe(
      combineLatest(
        this.applicationService.appSummary$
      ),
      map(([app, appSummary]: [ApplicationData, EntityInfo<AppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }), distinct());

    this.sshStatus$ = this.applicationService.application$.pipe(
      combineLatest(this.applicationService.appSpace$),
      map(([app, space]) => {
        if (!space.entity.allow_ssh) {
          return 'Disabled by the space';
        } else {
          return app.app.entity.enable_ssh ? 'Yes' : 'No';
        }
      })
    );

    this.deploySource$ = this.applicationService.applicationStratProject$.pipe(
      map(project => {
        if (!!project) {
          const deploySource =  { ... project.deploySource } as any;

          // Legacy
          if (deploySource.type === 'github') {
            deploySource.type = 'gitscm';
            deploySource.scm = 'github';
          }

          const scmType = deploySource.scm  as GitSCMType;
          const scm = this.scmService.getSCM(scmType);
          deploySource.label = scm.getLabel();
          deploySource.commitURL = scm.getCommitURL(deploySource.project, deploySource.commit);
          deploySource.icon = scm.getIcon();
          return deploySource;
        } else {
          return null;
        }
      })
    );
  }
}
