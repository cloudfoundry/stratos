import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../../core/src/features/endpoints/endpoint-helpers';
import { APP_GUID, CF_GUID } from '../../../../../core/src/shared/entity.tokens';
import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { ApplicationService } from '../../../features/applications/application.service';
import { getGuids } from '../../../features/applications/application/application-base.component';

@Component({
  selector: 'app-application-preview-component',
  templateUrl: './application-preview.component.html',
  styleUrls: ['./application-preview.component.scss'],
  // useless, necessary to reuse ApplicationService
  providers: [
    ApplicationService,
    {
      provide: CF_GUID,
      useFactory: getGuids('cf'),
      deps: [ActivatedRoute]
    },
    {
      provide: APP_GUID,
      useFactory: getGuids(),
      deps: [ActivatedRoute]
    },
  ]
})
export class ApplicationPreviewComponent implements PreviewableComponent {

  title = null;
  cfEndpointService: object;
  sshStatus$: Observable<string>;

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

    // this.detailsLoading$ = combineLatest([
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
