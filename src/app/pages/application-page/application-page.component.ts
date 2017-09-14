import { createEntitySelector, selectEntities, getEntity } from './../../store/actions/api.actions';
import { AppState } from './../../store/app-state';
import { GetApplication } from './../../store/actions/application.actions';
import { Store } from '@ngrx/store';
import { getCurrentPage } from '../../store/reducers/pagination.reducer';
import { ApplicationSchema } from '../../store/actions/application.actions';
import { Subscription } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-application-page',
  templateUrl: './application-page.component.html',
  styleUrls: ['./application-page.component.scss']
})
export class ApplicationPageComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private store: Store<AppState>) { }

  sub: Subscription;
  isFetching: boolean;
  application;

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      const { id, cfId } = params;
      getEntity(
        this.store,
        ApplicationSchema.key,
        ApplicationSchema,
        id,
        new GetApplication(id, cfId)
      ).subscribe(application => {
        this.application = application;
      });
    });

  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
