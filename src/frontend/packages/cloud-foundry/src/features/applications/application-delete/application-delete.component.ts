import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { defer, from, Observable, of } from 'rxjs';
import { catchError, filter, map, pairwise, shareReplay, startWith, take, tap } from 'rxjs/operators';

import {
  LoadingPageComponent,
  PageHeaderComponent,
  StepComponent,
  SteppersComponent } from '@stratosui/core';
import {
  RouterNav,
  GeneralEntityAppState,
  EntityMonitor,
  APIResource } from '@stratosui/store';
import {
  IApp,
  cfEntityCatalog,
  ApplicationService } from '@stratosui/cloud-foundry';

import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import type { StRoute, StServiceBinding } from '../../../services/endpoint-data/stratos-types';
import { AppRoutesPickerComponent } from './app-routes-picker.component';
import { AppServiceBindingsPickerComponent } from './app-service-bindings-picker.component';


@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    LoadingPageComponent,
    AppRoutesPickerComponent,
    AppServiceBindingsPickerComponent,
  ],
})
export class ApplicationDeleteComponent {
  private store = inject<Store<GeneralEntityAppState>>(Store);
  private applicationService = inject(ApplicationService);
  private apps = inject(CfAppsSignalConfigService);

  // Signal-native route + service binding state. Populated by direct HTTP
  // fetches to the native /pp/v1/cf/apps/{cnsi}/{app}/{routes|service_bindings}
  // endpoints in the constructor.
  public appRoutes = signal<StRoute[]>([]);
  public routesLoaded = signal<boolean>(false);
  public appBindings = signal<StServiceBinding[]>([]);
  public bindingsLoaded = signal<boolean>(false);
  public deleteStarted = false;

  public selectedRoutes: StRoute[] = [];
  public selectedServiceBindings: StServiceBinding[] = [];
  // Single-name observable derived from the entity monitor, used by the
  // confirmation template so the user can verify which app they're about
  // to delete.
  public appName$!: Observable<string>;
  // fetchingApplicationData$ drives the top-level loading spinner. Resolves
  // once the app's own fetch completes — the routes + bindings fetches run
  // in parallel and their load flags gate their respective stepper steps.
  public fetchingApplicationData$!: Observable<boolean>;

  public appMonitor!: EntityMonitor<APIResource<IApp>>;

  public cancelUrl: string;

  constructor() {
    const applicationService = this.applicationService;

    this.setupAppMonitor();
    this.cancelUrl = `/applications/${applicationService.cfGuid}/${applicationService.appGuid}`;

    this.fetchingApplicationData$ = this.finishedFetchingApplication().pipe(
      filter(finished => finished),
      take(1),
      map(() => false),
      shareReplay(1),
      startWith(true)
    );

    cfEntityCatalog.application.api.get(applicationService.appGuid, applicationService.cfGuid, {});

    // Parallel signal-native fetches for related entities. Failures surface
    // as empty lists — the stepper skips the empty step and the user can
    // still complete the app delete.
    void this.apps.fetchAppRoutes(applicationService.cfGuid, applicationService.appGuid)
      .then(routes => {
        this.appRoutes.set(routes);
        this.routesLoaded.set(true);
      })
      .catch(() => {
        this.appRoutes.set([]);
        this.routesLoaded.set(true);
      });
    void this.apps.fetchAppServiceBindings(applicationService.cfGuid, applicationService.appGuid)
      .then(bindings => {
        this.appBindings.set(bindings);
        this.bindingsLoaded.set(true);
      })
      .catch(() => {
        this.appBindings.set([]);
        this.bindingsLoaded.set(true);
      });
  }

  private setupAppMonitor() {
    this.appMonitor = this.getApplicationMonitor();
    this.appName$ = this.appMonitor.entity$.pipe(
      filter(app => !!app),
      map(app => app.entity?.name ?? ''),
      startWith(''),
    );
  }

  public redirectToAppWall() {
    this.store.dispatch(new RouterNav({ path: '/applications' }));
  }

  public getApplicationMonitor() {
    return cfEntityCatalog.application.store.getEntityMonitor(this.applicationService.appGuid);
  }

  /**
   * Returns an observable that emits a if the application fetch has finished or not.
   * Redirects to the app wall if we encounter an error when fetching the application.
   */
  private finishedFetchingApplication() {
    return this.appMonitor.entityRequest$.pipe(
      tap(entityRequestInfo => {
        if (entityRequestInfo.error) {
          this.redirectToAppWall();
        }
      }),
      pairwise(),
      map(([oldEntityRequestInfo, entityRequestInfo]) => {
        return !entityRequestInfo.error && (oldEntityRequestInfo.fetching && !entityRequestInfo.fetching);
      })
    );
  }

  public setSelectedServiceBindings(selected: StServiceBinding[]) {
    this.selectedServiceBindings = selected;
  }

  public setSelectedRoutes(selected: StRoute[]) {
    this.selectedRoutes = selected;
  }

  /**
   * Starts the deletion or the application and related entities.
   * It ensures that the application is deleted before attempting to delete the other entities.
   */
  public startDelete = () => {
    if (this.deleteStarted) {
      this.redirectToAppWall();
      return of({ success: true });
    }
    this.deleteStarted = true;
    const { appGuid, cfGuid } = this.applicationService;
    return defer(() => from(this.apps.deleteApp(cfGuid, appGuid))).pipe(
      tap(() => {
        // Route deletion + binding unbinding both go through the async-job
        // contract. Fire-and-forget — the app is already being deleted;
        // related-entity failures (CF refusing the delete because
        // destinations still reference the departing app) are surfaced via
        // the returned promises but don't block navigation.
        if (this.selectedRoutes && this.selectedRoutes.length) {
          this.selectedRoutes.forEach(route => {
            void this.apps.deleteRoute(cfGuid, route.guid).catch((): void => undefined);
          });
        }
        if (this.selectedServiceBindings && this.selectedServiceBindings.length) {
          this.selectedServiceBindings.forEach(binding => {
            void this.apps.deleteServiceBinding(cfGuid, binding.guid).catch((): void => undefined);
          });
        }
        // On successful delete: kick off a refresh so the app-wall lands on
        // a fresh fetch (not a stale cache), then redirect.
        void this.apps.refresh().catch((): void => undefined);
        this.redirectToAppWall();
      }),
      map(() => ({ success: true })),
      catchError(() => of({ success: false }))
    );
  };
}
