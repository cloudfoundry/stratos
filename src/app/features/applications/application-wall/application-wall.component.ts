import { Component, OnInit } from '@angular/core';
import { denormalize } from 'normalizr';

import { Observable } from 'rxjs/Rx';
import { skipWhile } from 'rxjs/operator/skipWhile';

import { Store } from '@ngrx/store';
import { getAPIResourceEntity } from '../../store/actions/api.actions';
import { EntitiesState } from '../../store/reducers/entity.reducer';
import { getCurrentPage, PaginationState, PaginationEntityState } from './../../store/reducers/pagination.reducer';
import { GetAllApplications, ApplicationSchema } from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';


@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss']
})
export class ApplicationWallComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  applications = [];
  isFetching: Observable<boolean>;

  ngOnInit() {
    const paginationKey = 'applicationWall';
    const getObs$ = getCurrentPage({
      entityType: ApplicationSchema.key,
      paginationKey: paginationKey,
      store: this.store,
      action: new GetAllApplications(paginationKey),
      schema: [ApplicationSchema]
    });
    this.isFetching = getObs$.mergeMap(({paginationEntity}) => {
      return Observable.of(paginationEntity.fetching);
    });

    getObs$
    .subscribe(({ paginationEntity, data }) => {
      if (!paginationEntity.fetching) {
        this.applications = data.map(getAPIResourceEntity);
      }
    });
  }

}
