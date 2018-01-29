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
import { AppMetadataTypes, GetAppSummaryAction, GetAppStatsAction } from '../../../../store/actions/app-metadata.actions';

import websocketConnect from 'rxjs-websockets';
import { QueueingSubject } from 'queueing-subject/lib';
import { LoggerService } from '../../../../core/logger.service';

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
    private store: Store<AppState>,
    private logService: LoggerService,
  ) { }

  public async: any;

  messages: Observable<string>;

  sub: Subscription[] = [];
  isFetching$: Observable<boolean>;
  application;
  applicationActions$: Observable<string[]>;

  appSub$: Subscription;
  entityServiceAppRefresh$: Subscription;
  autoRefreshString = 'auto-refresh';

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

    const { cfGuid, appGuid } = this.applicationService;
    // Auto refresh
    this.entityServiceAppRefresh$ = this.entityService.poll(10000, this.autoRefreshString).do(() => {
      this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
      this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
    }).subscribe();

    this.appSub$ = this.applicationService.app$.subscribe(app => {
      if (
        app.entityRequestInfo.deleting.deleted ||
        app.entityRequestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });
    this.setAppDefaults();

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

      this.setupstreamingStatusWebSocket();
  }

  setupstreamingStatusWebSocket() {
    const host = window.location.host;
    const streamUrl = (
      `wss://${host}/pp/v1/${this.applicationService.cfGuid}/apps/${this.applicationService.appGuid}/status`
    );
    this.messages = websocketConnect(
      streamUrl,
      new QueueingSubject<string>()
    )
      .messages
      .catch(e => {
        this.logService.error('Error while connecting to socket: ' + JSON.stringify(e));
        return [];
      })
      .share()
      .map(message => {
        const json = JSON.parse(message);
        return json;
      })
      .filter(l => !!l)
      .do(m => {
        if (m.logMessage && m.logMessage.message) {
          console.log(this.base64Decode(m.logMessage.message));
        }
        console.log(JSON.stringify(m, undefined, 2));
      });

      this.sub.push(this.messages.subscribe());
    }

    base64Decode(str : string) {
      if (!(/^[a-z0-9+/]+={0,2}$/i.test(str)) || str.length %4 != 0) {
        throw Error('Not base64 string');
      }
      const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let o1, o2, o3, h1, h2, h3, h4, bits, d=[];
  
      for (const c=0; c<str.length; c+=4) {  // unpack four hexets into three octets
          h1 = b64.indexOf(str.charAt(c));
          h2 = b64.indexOf(str.charAt(c+1));
          h3 = b64.indexOf(str.charAt(c+2));
          h4 = b64.indexOf(str.charAt(c+3));
  
          bits = h1<<18 | h2<<12 | h3<<6 | h4;
  
          o1 = bits>>>16 & 0xff;
          o2 = bits>>>8 & 0xff;
          o3 = bits & 0xff;
  
          d[c/4] = String.fromCharCode(o1, o2, o3);
          // check for padding
          if (h4 == 0x40) d[c/4] = String.fromCharCode(o1, o2);
          if (h3 == 0x40) d[c/4] = String.fromCharCode(o1);
      }
      str = d.join('');  // use Array.join() for better performance than repeated string appends
  
      return str;
  }


  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe());
    this.appSub$.unsubscribe();
    this.entityServiceAppRefresh$.unsubscribe();
  }
}
