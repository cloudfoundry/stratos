import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { ApplicationService, AppData } from '../../application.service';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  subs: Subscription[] = [];
  appData: AppData;

  ngOnInit() {
    this.subs.push(this.applicationService.application$.subscribe(appData => {
      this.appData = appData;
    }));
  }

  ngOnDestroy() {
    this.subs.forEach(subscription => subscription.unsubscribe);
  }

}
