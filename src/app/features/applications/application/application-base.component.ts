import { UpdatingSection } from '../../../store/reducers/api-request-reducer';
import { AppMetadataType } from '../../../store/types/app-metadata.types';
import { AppMetadataProperties, GetAppMetadataAction } from '../../../store/actions/app-metadata.actions';
import { EntityService } from '../../../core/entity-service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { DeleteApplication, GetApplication, UpdateApplication, ApplicationSchema } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { ApplicationData, ApplicationService } from '../application.service';
import { RouterNav } from '../../../store/actions/router.actions';

const entityServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute
) => {
  const { id, cfId } = activatedRoute.snapshot.params;
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    id,
    new GetApplication(id, cfId)
  );
};


@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [
    ApplicationService,
    {
      provide: EntityService,
      useFactory: entityServiceFactory,
      deps: [Store, ActivatedRoute]
    }
  ]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private entityService: EntityService,
    private store: Store<AppState>
  ) { }

  public async: any;

  sub: Subscription[] = [];
  isFetching$: Observable<boolean>;
  application;
  applicationActions$: Observable<string[]>;

  isEditSummary = false;

  summaryExpanded = true;

  summaryDataChanging$: Observable<boolean>;

  autoRefreshing$ = this.entityService.updatingSection$.map(update => update[this.autoRefreshString] || { busy: false });

  appEdits: UpdateApplication;
  appDefaultEdits: UpdateApplication = {
    enable_ssh: false,
    instances: 0,
    memory: 0,
    name: '',
    environment_json: {}
  };

  tabLinks = [
    { link: 'build', label: 'Build Info' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' },
    { link: 'ssh', label: 'SSH' }
  ];

  autoRefreshString = 'auto-refresh';

  startEdit() {
    this.isEditSummary = true;
    this.setAppDefaults();
  }

  endEdit() {
    this.isEditSummary = false;
  }

  saveEdits() {
    this.endEdit();
    this.applicationService.updateApplication(this.appEdits);
  }

  stopApplication() {
    this.endEdit();
    const stoppedString = 'STOPPED';
    this.applicationService.updateApplication({
      state: stoppedString
    });

    this.entityService.poll(1000, 'stopping')
      .takeWhile(({ resource, updatingSection }) => {
        return resource.entity.state !== stoppedString;
      }).subscribe();
  }

  startApplication() {
    this.endEdit();
    const startedString = 'STARTED';
    this.applicationService.updateApplication({
      state: startedString
    });

    this.entityService.poll(1000, 'starting')
      .takeWhile(({ resource, updatingSection }) => {
        return resource.entity.state !== startedString;
      })
      .delay(1)
      .subscribe();
  }

  setAppDefaults() {
    this.appEdits = { ... this.appDefaultEdits };
  }

  deleteApplication() {
    this.store.dispatch(new DeleteApplication(this.applicationService.appGuid, this.applicationService.cfGuid));
  }

  ngOnInit() {
    this.setAppDefaults();

    this.route.params.first().subscribe(params => {
      const { id, cfId } = params;
      this.applicationService.setApplication(cfId, id);
      this.isFetching$ = this.applicationService.isFetchingApp$;
      // Auto refresh
      this.sub.push(this.entityService.poll(10000, this.autoRefreshString).do(() => {
        this.store.dispatch(new GetAppMetadataAction(id, cfId, AppMetadataProperties.SUMMARY as AppMetadataType));
      }).subscribe());
    });

    const initialFetch$ = Observable.combineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$,
    ).map(([isFetchingApp, isFetchingEnvVars, isFetchingStats]) => {
      return isFetchingApp || isFetchingEnvVars || isFetchingStats;
    }).distinctUntilChanged();

    this.summaryDataChanging$ = Observable.combineLatest(
      initialFetch$,
      this.applicationService.isUpdatingApp$,
      this.autoRefreshing$
    ).map(([isFetchingApp, isUpdating, autoRefresh]) => {
      if (autoRefresh.busy) {
        return false;
      }
      return isFetchingApp || isUpdating;
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
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.sub.push(appSub);
  }


  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe());
  }
}
