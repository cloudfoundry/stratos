import { Component, OnInit } from '@angular/core';

import { skipWhile } from 'rxjs/operator/skipWhile';
import { denormalize } from 'normalizr';

import { Store } from '@ngrx/store';

import { EntitiesState } from '../../../store/reducers/api.reducer';
import { getCurrentPage, PaginationState, PaginationEntityState } from './../../../store/reducers/pagination.reducer';
import { GetAllApplications, ApplicationSchema } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss']
})
export class ApplicationWallComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  applications = [];
  isFetching = false;

  ngOnInit() {
    const paginationKey = 'applicationWall';
    getCurrentPage({
      entityType: ApplicationSchema.key,
      paginationKey: paginationKey,
      store: this.store,
      action: new GetAllApplications(paginationKey),
      schema: [ApplicationSchema]
    })
    .subscribe(({ paginationEntity, data }) => {
      this.isFetching = paginationEntity.fetching;
      if (!this.isFetching ) {
        this.applications = data;
      }
    });
  }

}
