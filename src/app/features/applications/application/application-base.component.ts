import { Subscription } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { ApplicationService } from '../application.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [ ApplicationService ]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  sub: Subscription[] = [];
  isFetching$: Observable<boolean>;
  application;
  
  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' },
    { link: 'ssh', label: 'SSH' }
  ];

  ngOnInit() {
    this.sub.push(this.route.params.subscribe(params => {
      const { id, cfId } = params;
      this.applicationService.SetApplication(cfId, id)
      this.sub.push(this.applicationService.application$.subscribe(({ entity, entityRequestInfo }) => {
        this.application = entity;
      }));
      this.isFetching$ = this.applicationService.isFetching$;
    }));
  }

  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe);
  }
}
