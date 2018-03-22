import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, map, take, tap } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators/withLatestFrom';
import { Subscription } from 'rxjs/Rx';

import { IApp, IOrganization, ISpace } from '../../../../core/cf-api.types';
import { EntityService } from '../../../../core/entity-service';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { IHeaderBreadcrumb } from '../../../../shared/components/page-header/page-header.types';
import { ISubHeaderTabs } from '../../../../shared/components/page-subheader/page-subheader.types';
import { GetAppStatsAction, GetAppSummaryAction } from '../../../../store/actions/app-metadata.actions';
import { DeleteApplication } from '../../../../store/actions/application.actions';
import { ResetPagination } from '../../../../store/actions/pagination.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { appStatsSchemaKey } from '../../../../store/helpers/entity-factory';
import { endpointEntitiesSelector } from '../../../../store/selectors/endpoint.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { EndpointModel } from '../../../../store/types/endpoint.types';
import { ApplicationService } from '../../application.service';

// Confirmation dialogs
const appStopConfirmation = new ConfirmationDialogConfig(
  'Stop Application',
  'Are you sure you want to stop this Application?',
  'Stop'
);
const appStartConfirmation = new ConfirmationDialogConfig(
  'Start Application',
  'Are you sure you want to start this Application?',
  'Start'
);

// App delete will have a richer delete experience
const appDeleteConfirmation = new ConfirmationDialogConfig(
  'Delete Application',
  'Are you sure you want to delete this Application?',
  'Delete',
  true
);

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
    private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService
  ) {
    const endpoints$ = store.select(endpointEntitiesSelector);
    this.breadcrumbs$ = applicationService.waitForAppEntity$.pipe(
      withLatestFrom(
        endpoints$,
        applicationService.appOrg$,
        applicationService.appSpace$
      ),
      map(([app, endpoints, org, space]) => {
        return this.getBreadcrumbs(
          app.entity.entity,
          endpoints[app.entity.entity.cfGuid],
          org,
          space
        );
      }),
      first()
    );
  }
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  isFetching$: Observable<boolean>;
  applicationActions$: Observable<string[]>;
  addedGitHubTab = false;
  summaryDataChanging$: Observable<boolean>;
  appSub$: Subscription;
  entityServiceAppRefresh$: Subscription;
  autoRefreshString = 'auto-refresh';

  autoRefreshing$ = this.entityService.updatingSection$.map(
    update => update[this.autoRefreshString] || { busy: false }
  );

  tabLinks: ISubHeaderTabs[] = [
    { link: 'summary', label: 'Summary' },
    { link: 'instances', label: 'Instances' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' }
  ];

  private getBreadcrumbs(
    application: IApp,
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    const baseCFUrl = `/cloud-foundry/${application.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;
    return [
      {
        breadcrumbs: [{
          value: 'Applications',
          routerLink: '/applications'
        }]
      },
      {
        key: 'space',
        breadcrumbs: [
          {
            value: endpoint.name,
            routerLink: `${baseCFUrl}/organizations`
          },
          {
            value: org.entity.name,
            routerLink: `${baseOrgUrl}/spaces`
          },
          {
            value: space.entity.name,
            routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/apps`
          }
        ]
      }
    ];
  }

  private startStopApp(confirmConfig: ConfirmationDialogConfig, updateKey: string, requiredAppState: string, onSuccess: () => void) {
    this.applicationService.application$.pipe(
      first(),
      tap(appData => {
        this.confirmDialog.open(confirmConfig, () => {
          this.applicationService.updateApplication({ state: requiredAppState }, [], appData.app.entity);
          this.pollEntityService(updateKey, requiredAppState).delay(1).subscribe(() => { }, () => { }, onSuccess);
        });
      })
    ).subscribe();
  }

  stopApplication() {
    this.startStopApp(appStopConfirmation, 'stopping', 'STOPPED', () => {
      // On app reaching the 'STOPPED' state clear the app's stats pagination section
      const { cfGuid, appGuid } = this.applicationService;
      this.store.dispatch(new ResetPagination(appStatsSchemaKey, new GetAppStatsAction(appGuid, cfGuid).paginationKey));
    });
  }

  pollEntityService(state, stateString) {
    return this.entityService
      .poll(1000, state)
      .takeWhile(({ resource, updatingSection }) => {
        return resource.entity.state !== stateString;
      });
  }

  startApplication() {
    this.startStopApp(appStartConfirmation, 'starting', 'STARTED', () => {
      // On app reaching the 'STARTED' state immediately go fetch the app stats instead of waiting for the normal poll to kick in
      const { cfGuid, appGuid } = this.applicationService;
      this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
    });
  }

  deleteApplication() {
    this.confirmDialog.open(appDeleteConfirmation, () => {
      this.store.dispatch(
        new DeleteApplication(
          this.applicationService.appGuid,
          this.applicationService.cfGuid
        )
      );
    });
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    // Auto refresh
    this.entityServiceAppRefresh$ = this.entityService
      .poll(10000, this.autoRefreshString)
      .do(({ resource }) => {
        this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
        if (resource && resource.entity && resource.entity.state === 'STARTED') {
          this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
        }
      })
      .subscribe();

    this.appSub$ = this.applicationService.app$.subscribe(app => {
      if (
        app.entityRequestInfo.deleting.deleted ||
        app.entityRequestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.isFetching$ = this.applicationService.isFetchingApp$;

    const initialFetch$ = Observable.combineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
    )
      .map(([isFetchingApp, isFetchingEnvVars, isFetchingStats]) => {
        return isFetchingApp || isFetchingEnvVars || isFetchingStats;
      });

    this.summaryDataChanging$ = Observable.combineLatest(
      initialFetch$,
      this.applicationService.isUpdatingApp$,
      this.autoRefreshing$
    ).map(([isFetchingApp, isUpdating, autoRefresh]) => {
      if (autoRefresh.busy) {
        return false;
      }
      return !!(isFetchingApp || isUpdating);
    });

    this.applicationService.applicationStratProject$
      .pipe(take(1))
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
          stratProject.deploySource.type === 'github'
        ) {
          this.tabLinks.push({ link: 'github', label: 'GitHub' });
        }
      });
  }

  ngOnDestroy() {
    this.appSub$.unsubscribe();
    this.entityServiceAppRefresh$.unsubscribe();
  }
}
