import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { ApplicationService, AppData } from '../../application.service';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  appData$: Observable<AppData>;

  ngOnInit() {
    this.appData$ = this.applicationService.application$;
  }

}
