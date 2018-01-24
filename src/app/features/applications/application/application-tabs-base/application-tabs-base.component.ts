import { AppState } from '../../../../store/app-state';
import { EntityService } from '../../../../core/entity-service';
import { ApplicationService, ApplicationData } from '../../application.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';
import { UpdateApplication, DeleteApplication } from '../../../../store/actions/application.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppMetadataTypes } from '../../../../store/actions/app-metadata.actions';

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss']
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {

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
    { link: 'summary', label: 'Summary' },
    { link: 'instances', label: 'Instances' },
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
    this.applicationService.updateApplication(this.appEdits, [AppMetadataTypes.SUMMARY]);
  }

  stopApplication() {
    this.endEdit();
    const stoppedString = 'STOPPED';
    this.applicationService.updateApplication({ state: stoppedString }, []);
    this.pollEntityService('stopping', stoppedString).subscribe();
  }

  pollEntityService(state, stateString) {
    return this.entityService.poll(1000, state)
      .takeWhile(({ resource, updatingSection }) => {
        return resource.entity.state !== stateString;
      });
  }

  startApplication() {
    this.endEdit();
    const startedString = 'STARTED';
    this.applicationService.updateApplication({ state: startedString }, []);

    this.pollEntityService('starting', startedString)
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

    const { cfGuid, appGuid } = this.applicationService;
    this.isFetching$ = this.applicationService.isFetchingApp$;

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
  }


  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe());
  }
}
