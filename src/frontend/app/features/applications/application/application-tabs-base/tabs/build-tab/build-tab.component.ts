import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { combineLatest, distinct, map, startWith } from 'rxjs/operators';

import { IAppSummary } from '../../../../../../core/cf-api.types';
import { GitSCMService } from '../../../../../../shared/data-services/scm/scm.service';
import { APIResource, EntityInfo } from '../../../../../../store/types/api.types';
import { getFullEndpointApiUrl } from '../../../../../endpoints/endpoint-helpers';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';
import { GitSCMType } from './../../../../../../shared/data-services/scm/scm.service';

const isDockerHubRegEx = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)/g;

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

  deploySource$: Observable<{ type: string, [name: string]: any }>;

  ngOnInit() {
    this.cardTwoFetching$ = this.applicationService.application$.pipe(
      combineLatest(
        this.applicationService.appSummary$
      ),
      map(([app, appSummary]: [ApplicationData, EntityInfo<APIResource<IAppSummary>>]) => {
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
      combineLatest(this.applicationService.application$)
    ).pipe(
      map(([project, app]) => {
        if (!!project) {
          const deploySource = { ...project.deploySource } as any;

          // Legacy
          if (deploySource.type === 'github') {
            deploySource.type = 'gitscm';
            deploySource.scm = 'github';
          }

          if (deploySource.type === 'gitscm') {
            const scmType = deploySource.scm as GitSCMType;
            const scm = this.scmService.getSCM(scmType);
            deploySource.label = scm.getLabel();
            deploySource.commitURL = scm.getCommitURL(deploySource.project, deploySource.commit);
            deploySource.icon = scm.getIcon();
          }

          return deploySource;
        } else if (app.app.entity.docker_image) {
          return {
            type: 'docker',
            dockerImage: app.app.entity.docker_image,
            dockerUrl: this.createDockerImageUrl(app.app.entity.docker_image)
          };
        } else {
          return null;
        }
      }),
      startWith({ type: 'loading' })
    );
  }

  private createDockerImageUrl(dockerImage: string): string {
    // https://docs.cloudfoundry.org/devguide/deploy-apps/push-docker.html
    // Private Registry: MY-PRIVATE-REGISTRY.DOMAIN:PORT/REPO/IMAGE:TAG
    // GCP: docker://MY-REGISTRY-URL/MY-PROJECT/MY-IMAGE-NAME
    // DockerHub: REPO/IMAGE:TAG
    isDockerHubRegEx.lastIndex = 0;
    const res = isDockerHubRegEx.exec(dockerImage);
    return res && res.length === 4 ? `https://hub.docker.com/r/${res[1]}/${res[2]}` : null;
  }
}
