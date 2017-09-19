import { createEntitySelector, selectEntities, getEntity } from './../../store/actions/api.actions';
import { AppState } from './../../store/app-state';
import { GetApplication } from './../../store/actions/application.actions';
import { Store } from '@ngrx/store';
import { getCurrentPage } from '../../store/reducers/pagination.reducer';
import { ApplicationSchema } from '../../store/actions/application.actions';
import { Subscription } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [ ApplicationService ]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  sub: Subscription[] = [];
  // isFetching: boolean;
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
    console.log('application-base: on init');

    this.sub.push(this.route.params.subscribe(params => {
      const { id, cfId } = params;
      this.applicationService.SetApplication(cfId, id)
      this.sub.push(this.applicationService.GetApplication().subscribe(application => {
        console.log('application-base: have app');
        this.application = application;
      }));
    }));
  }

  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe);
  }
}
