import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, startWith, tap } from 'rxjs/operators';
import { ApplicationStateData, CardStatus, ApplicationStateService } from '../../../application-state/application-state.service';
import { AppState } from '../../../../../store/app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss']
})
export class CompactAppCardComponent implements OnInit {

  @Input('app') app;

  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<CardStatus>;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) { }
  ngOnInit() {
    const initState = this.appStateService.get(this.app.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.app.entity,
      this.app.metadata.guid,
      this.activeRouteCfOrgSpace.cfGuid
    ).pipe(
      startWith(initState)
    );
    this.appStatus$ = this.applicationState$.pipe(
      map(state => state.indicator)
    );
  }
}

