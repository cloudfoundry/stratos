import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs';

import { ApplicationService } from '../../application.service';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  sub: Subscription;
  application;

  ngOnInit() {
    this.sub = this.applicationService.application$.subscribe(({ entity, entityRequestInfo }) => {
      this.application = entity;
    });

  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
