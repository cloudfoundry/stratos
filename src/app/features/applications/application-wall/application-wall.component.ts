import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs/Rx';

import { getAPIResourceEntity } from '../../../store/actions/api.actions';
import { ApplicationSchema, GetAllApplications } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { getCurrentPage } from './../../../store/reducers/pagination.reducer';


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
  ]
})
export class ApplicationWallComponent implements OnInit, OnDestroy {

  constructor(private store: Store<AppState>) { }

  applications = [];
  isFetching: Observable<boolean>;
  error: boolean;

  wallSub: Subscription;

  ngOnInit() {
    const paginationKey = 'applicationWall';
    const getObs$ = getCurrentPage({
      entityType: ApplicationSchema.key,
      paginationKey: paginationKey,
      store: this.store,
      action: new GetAllApplications(paginationKey),
      schema: [ApplicationSchema]
    });
    this.isFetching = getObs$.mergeMap(({ paginationEntity }) => {
      return Observable.of(paginationEntity.fetching);
    });

    this.wallSub = getObs$
      .delay(100)
      .subscribe(({ paginationEntity, data }) => {
        this.error = paginationEntity.error;
        if (!paginationEntity.fetching) {
          if (!paginationEntity.error) {
            this.applications = data.map(getAPIResourceEntity);
          }
        }
      });
  }

  ngOnDestroy() {
    this.wallSub.unsubscribe();
  }

}
