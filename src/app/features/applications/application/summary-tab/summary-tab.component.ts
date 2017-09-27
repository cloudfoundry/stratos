import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../application.service';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  subs: Subscription[] = [];
  application;
  stack;

  ngOnInit() {
    // this.subs.push(this.applicationService.application$.subscribe(([{ entity, entityRequestInfo }, cnsi]) => {
    //   console.log('APPLICATION');
    //   this.application = entity;
    //   console.log(cnsi);
    //   // console.log(entity);
    //   // console.log(entityRequestInfo);
    // }));

    // this.subs.push(this.applicationService.stack$.subscribe(({ entity, entityRequestInfo }) => {
    //   console.log('STACK');
    //   this.stack = entity;
    //   console.log(entity);
    //   console.log(entityRequestInfo);
    // }));

    this.subs.push(this.applicationService.application$.subscribe(({ entity, entityRequestInfo }) => {
      console.log('APPLICATION');
      this.application = entity.entity;
      console.log(entity.metadata);
      // console.log(cnsi);
      // console.log(entity);
      // console.log(entityRequestInfo);
    }));

    this.subs.push(this.applicationService.stack$.subscribe(({ entity, entityRequestInfo }) => {
      console.log('STACK');
      this.stack = entity;
      console.log(entity);
      console.log(entityRequestInfo);
    }));
  }

  ngOnDestroy() {
    this.subs.forEach(subscription => subscription.unsubscribe);
  }

}
