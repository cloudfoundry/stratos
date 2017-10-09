import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { EntityInfo } from '../../../../store/actions/api.actions';
import { ApplicationData, ApplicationService } from '../../application.service';

//TODO: RENAME FROM summary TO somtehing BUILD/DEPLY ish
@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit {
  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  appService = this.applicationService;

  cardTwoFetching$: Observable<boolean>;

  ngOnInit() {

    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
      this.appService.appSummary$
      )
      .mergeMap(([app, { entity, entityRequestInfo }]: [ApplicationData, EntityInfo]) => {
        return Observable.of(app.fetching || entityRequestInfo.fetching);
      });
  }

}
