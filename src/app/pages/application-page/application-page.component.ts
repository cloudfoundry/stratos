import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { ApplicationSchema } from '../../store/actions/application.actions';
import { getEntityObservable } from './../../store/actions/api.actions';
import { GetApplication } from './../../store/actions/application.actions';
import { AppState } from './../../store/app-state';

@Component({
  selector: 'app-application-page',
  templateUrl: './application-page.component.html',
  styleUrls: ['./application-page.component.scss']
})
export class ApplicationPageComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private store: Store<AppState>) { }

  sub: Subscription;
  isFetching: Observable<boolean>;
  application;
  request: {
    [key: string]: any
  } = {};

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      const { id, cfId } = params;
      const getObs$ = getEntityObservable(
        this.store,
        ApplicationSchema.key,
        ApplicationSchema,
        id,
        new GetApplication(id, cfId)
      );

      getObs$.subscribe(({ entity, entityRequestInfo }) => {
        this.application = entity;
        this.request = entityRequestInfo;
      });

      this.isFetching = getObs$.mergeMap(({ entityRequestInfo }) => {
        console.log(entityRequestInfo.fetching);
        return Observable.of(entityRequestInfo.fetching);
      });

    });

  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
