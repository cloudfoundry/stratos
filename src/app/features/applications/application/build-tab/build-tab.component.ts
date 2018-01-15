import { NewRoute } from '../../../../store/actions/route.actions';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { ApplicationData, ApplicationService } from '../../application.service';
import { AppMetadataInfo } from '../../../../store/types/app-metadata.types';

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
      .map(([app, appSummary]: [ApplicationData, AppMetadataInfo]) => {
        return app.fetching || appSummary.metadataRequestState.fetching.busy;
      }).distinct();
  }
}
