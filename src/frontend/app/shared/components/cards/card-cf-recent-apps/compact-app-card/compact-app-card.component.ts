import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, startWith } from 'rxjs/operators';
import { ApplicationStateData, CardStatus, ApplicationStateService } from '../../../application-state/application-state.service';
import { AppState } from '../../../../../store/app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss']
})
export class CompactAppCardComponent implements OnInit {

  @Input('row') row;

  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<CardStatus>;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService
  ) { }
  ngOnInit() {

    console.log(this.row);
    const initState = this.appStateService.get(this.row.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.row.entity,
      this.row.metadata.guid,
      this.row.entity.cfGuid
    ).pipe(
      startWith(initState)
    );
    this.appStatus$ = this.applicationState$.pipe(
      map(state => state.indicator),
    );
  }
}

