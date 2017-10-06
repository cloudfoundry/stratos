import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss']
})
export class ApplicationBaseComponent implements OnInit {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  isFetching$: Observable<boolean>;
  application$;

  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' },
    { link: 'ssh', label: 'SSH' }
  ];

  ngOnInit() {
    this.route.params
      .first()
      .subscribe(params => {
        const { id, cfId } = params;
        this.applicationService.SetApplication(cfId, id);
        this.application$ = this.applicationService.application$
          .map(({ entity, entityRequestInfo }) => {
            return entity;
          });
        this.isFetching$ = this.applicationService.isFetching$;
      });
  }
}
