import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { ApplicationData, ApplicationService } from '../../../../application.service';
import { EntityInfo } from '../../../../store/types/api.types';
import { AppSummary } from '../../../../store/types/app-metadata.types';

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss']
})
export class BuildTabComponent implements OnInit {
  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  appService = this.applicationService;

  cardTwoFetching$: Observable<boolean>;

  public async: any;

  ngOnInit() {

    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
      this.appService.appSummary$
      )
      .map(([app, appSummary]: [ApplicationData, EntityInfo<AppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }).distinct();
  }

}
