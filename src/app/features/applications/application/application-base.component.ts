import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { DeleteApplication, UpdateApplication } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { ApplicationData, ApplicationService } from '../application.service';

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [ApplicationService]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {
  [x: string]: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private store: Store<AppState>
  ) { }

  public async: any;

  sub: Subscription[] = [];
  isFetching$: Observable<boolean>;
  application;

  isEditSummary = false;

  summaryExpanded = true;

  summaryDataChanging$: Observable<boolean>;

  appEdits: UpdateApplication;
  appDefaultEdits: UpdateApplication = {
    enable_ssh: false,
    instances: 0,
    memory: 0,
    name: '',
    environment_json: {}
  };

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

  deleteApplication() {
    this.store.dispatch(new DeleteApplication(this.applicationService.appGuid, this.applicationService.cfGuid));
  }

  ngOnInit() {
    this.setAppDefaults();

    this.sub.push(this.route.params.subscribe(params => {
      const { id, cfId } = params;
      this.applicationService.SetApplication(cfId, id);
      this.isFetching$ = this.applicationService.isFetchingApp$;
    }));

    this.summaryDataChanging$ = Observable.combineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isUpdatingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
    ).map(([isFetchingApp, isUpdatingApp, isFetchingEnvVars, isFetchingStats]) => {
      const isFetching = isFetchingApp || isFetchingEnvVars || isFetchingStats;
      const isUpdating = isUpdatingApp;
      return isFetching || isUpdating;
    });

    this.sub.push(this.summaryDataChanging$
      .filter((isChanging) => {
        return !isChanging;
      })
      .mergeMap(_ => {
        return this.applicationService.application$;
      })
      .subscribe((application: ApplicationData) => {
        this.appDefaultEdits = {
          name: application.app.entity.name,
          instances: application.app.entity.instances,
          memory: application.app.entity.memory,
          enable_ssh: application.app.entity.enable_ssh,
          environment_json: application.app.entity.environment_json
        };
      }));

    const appSub = this.applicationService.app$.subscribe(app => {
      if (
        app.entityRequestInfo.deleting.deleted ||
        app.entityRequestInfo.error
      ) {
        this.router.navigateByUrl('applications');
      }
    });

    this.sub.push(appSub);
  }


  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe());
  }
}
