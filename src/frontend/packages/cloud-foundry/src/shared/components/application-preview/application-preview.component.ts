import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { combineLatest, distinct, map } from 'rxjs/operators';

import { IAppSummary } from '../../../../../core/src/core/cf-api.types';
import { getFullEndpointApiUrl } from '../../../../../core/src/features/endpoints/endpoint-helpers';
import { APP_GUID, CF_GUID } from '../../../../../core/src/shared/entity.tokens';
import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { ApplicationData, ApplicationService } from '../../../features/applications/application.service';

@Component({
  selector: 'app-application-preview-component',
  templateUrl: './application-preview.component.html',
  styleUrls: ['./application-preview.component.scss'],
  providers: [
    ApplicationService,
    {
      provide: CF_GUID,
      useValue: '',
    },
    {
      provide: APP_GUID,
      useValue: '',
    },
  ]
})
export class ApplicationPreviewComponent implements PreviewableComponent {

  title = null;
  cfEndpointService: object;
  sshStatus$: Observable<string>;
  detailsLoading$: Observable<boolean>;

  getFullEndpointApiUrl = getFullEndpointApiUrl;

  constructor(public applicationService: ApplicationService) {
  }

  setProps(props: { [key: string]: any }) {
    this.title = props.title;

    this.applicationService.initialize(props.cfGuid, props.guid);
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

    this.detailsLoading$ = this.applicationService.application$.pipe(
      combineLatest(
        this.applicationService.appSummary$
      ),
      map(([app, appSummary]: [ApplicationData, EntityInfo<IAppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }), distinct());

      //   // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
    //   this.cfEndpointService.appsPagObs.fetchingEntities$.pipe(
    //     filter(loading => !loading)
    //   ),
    // ]).pipe(
    //   map(() => false),
    //   startWith(true)
    // );
  }
}
