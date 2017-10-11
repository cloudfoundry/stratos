import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { EntityInfo } from '../../../store/actions/api.actions';
import { AppMetadataInfo } from '../../../store/actions/app-metadata.actions';
import { ApplicationData, ApplicationService } from '../application.service';

interface ApplicationEdits {
  name: string;
  instances: number;
  memory: number;
  enable_ssh: boolean;
}

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [ApplicationService]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {
  [x: string]: any;

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  sub: Subscription[] = [];
  isFetching$: Observable<boolean>;
  application;

  isEditSummary = false;

  summaryExpanded = true;

  summaryDataChanging: Observable<boolean>;

  appEdits: ApplicationEdits;
  appDefaultEdits: ApplicationEdits;

  tabLinks = [
    { link: 'summary', label: 'Build Info' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' },
    { link: 'ssh', label: 'SSH' }
  ];

  startEdit() {
    this.isEditSummary = true;
    this.setAppDefaults();
  }

  endEdit() {
    this.isEditSummary = false;
  }

  saveEdits() {
    this.endEdit();
    this.applicationService.UpdateApplication(this.appEdits);
  }

  setAppDefaults() {
    this.appEdits = { ... this.appDefaultEdits };
  }

  ngOnInit() {
    this.sub.push(this.route.params.subscribe(params => {
      const { id, cfId } = params;
      this.applicationService.SetApplication(cfId, id);
      this.sub.push(this.applicationService.application$.subscribe(({ app }) => {
        this.application = app.entity;
      }));
      this.isFetching$ = this.applicationService.isFetchingApp$;
    }));

    this.appEdits = {
      name: '',
      instances: 0,
      memory: 0,
      enable_ssh: false
    };

    this.summaryDataChanging$ = this.applicationService.isFetchingApp$
      .combineLatest(
      this.applicationService.isUpdatingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
      ).map(([isFetchingApp, isUpdatingApp, isFetchingEnvVars, isFetchingStats]: [boolean, boolean, boolean, boolean]) => {
        const isFetching = isFetchingApp || isFetchingEnvVars || isFetchingStats;
        const isUpdating = isUpdatingApp;

        console.log('isFetchingApp ', isFetchingApp);
        console.log('isFetchingEnvVars ', isFetchingEnvVars);
        console.log('isFetchingStats ', isFetchingStats);

        console.log('isFetching ', isFetching);
        console.log('isUpdating ', isUpdating);
        console.log(isFetching || isUpdating);
        return isFetching || isUpdating;
      });

    this.sub.push(this.summaryDataChanging$
      .filter((isChanging) => {
        return !isChanging;
      })
      .mergeMap(_ => {
        return Observable.combineLatest(this.applicationService.application$, this.applicationService.appSummary$);
      })
      .subscribe(([application, appSummary]: [ApplicationData, EntityInfo]) => {
        this.appDefaultEdits = {
          name: application.app.entity.name,
          instances: appSummary.entity.entity.instances,
          memory: application.app.entity.memory,
          enable_ssh: application.app.entity.enable_ssh
        };
      }));
  }


  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe());
  }
}
