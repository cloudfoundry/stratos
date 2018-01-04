import { denormalize } from 'normalizr';
import { Observable } from 'rxjs/Rx';
import { getAPIRequestDataState } from '../../../store/selectors/api.selectors';
import { map, tap, withLatestFrom, filter, toArray } from 'rxjs/operators';
import { selectPaginationState } from '../../../store/selectors/pagination.selectors';
import { ListConfig } from '../../../shared/components/list/list.component';
import { CfAppConfigService } from '../../../shared/list-configs/cf-app-config.service';
import { CardAppComponent } from '../../../shared/components/cards/custom-cards/card-app/card-app.component';
import { Component } from '@angular/core';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { EndpointsService } from '../../../core/endpoints.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ApplicationSchema } from '../../../store/actions/application.actions';
import { GetAppMetadataAction, getAppMetadataObservable } from '../../../store/actions/app-metadata.actions';
import { AppMetadataType } from '../../../store/types/app-metadata.types';
import { AppMetadataProperties } from '../../../store/actions/app-metadata.actions';

@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  animations: [
    trigger(
      'cardEnter', [
        transition('* => *', [
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ], { optional: true })
        ])
      ]
    )
  ],
  providers: [{
    provide: ListConfig,
    useClass: CfAppConfigService
  }]
})
export class ApplicationWallComponent {

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>
  ) {

    const paginationSelect$ = store.select(selectPaginationState('application', 'applicationWall'));

    const entities$ = paginationSelect$.pipe(
      withLatestFrom(store.select(getAPIRequestDataState)),
      map(([paginationEntity, entities]) => {
        if (!paginationEntity) {
          return;
        }
        const page = paginationEntity.ids[paginationEntity.currentPage];
        return page ? denormalize(page, [ApplicationSchema], entities) : null;
      }),
      filter(p => !!p),
      tap(p => {
        p.forEach(app => {
          const appState = app.entity.state;
          const appGuid = app.entity.guid;
          const cfGuid = app.entity.cfGuid;
          if (appState === 'STARTED') {
             this.store.dispatch(new GetAppMetadataAction(appGuid, cfGuid, AppMetadataProperties.INSTANCES as AppMetadataType));
          }
        });
      }),
    ).subscribe();
   }

  cardComponent = CardAppComponent;
}
