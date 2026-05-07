import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, pairwise, shareReplay, startWith, take, tap } from 'rxjs/operators';

import {
  LoadingPageComponent,
  PageHeaderComponent,
  SignalStepHandle,
  StepComponent,
  SteppersComponent } from '@stratosui/core';
import {
  EntityMonitor,
  APIResource } from '@stratosui/store';
import {
  IApp,
  cfEntityCatalog,
  ApplicationService } from '@stratosui/cloud-foundry';

import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { AppDetailDataService } from '../app-detail-data.service';
import type { StRoute, StServiceBinding } from '../../../services/endpoint-data/stratos-types';
import { AppDeleteSelectionService } from '../app-delete-selection.service';
import { AppRoutesPickerComponent } from './app-routes-picker.component';
import { AppServiceBindingsPickerComponent } from './app-service-bindings-picker.component';


@Component({
  selector: 'app-application-delete',
  templateUrl: './application-delete.component.html',
  styleUrls: ['./application-delete.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    LoadingPageComponent,
    AppRoutesPickerComponent,
    AppServiceBindingsPickerComponent,
  ],
})
export class ApplicationDeleteComponent {
  private applicationService = inject(ApplicationService);
  private apps = inject(CfAppsSignalConfigService);
  private selection = inject(AppDeleteSelectionService);
  private dataService = inject(AppDetailDataService);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private router = inject(Router);

  // Hot path (clicked trash on summary): selection.target() is populated
  // by AppApplicationActionsService.redirectToDelete() before navigation
  // and the wizard renders synchronously from this seed.
  // Cold path (refresh / direct URL / bookmark): selection.target() is
  // null. The computed signals below fall back to the data service's
  // signals (and the endpoint observable) — those populate as the
  // parent's data service finishes its fetch. Cold-load is uncommon but
  // still needs to render real names, not "?".
  private readonly seed = this.selection.target();

  public readonly appName = computed(() =>
    this.seed?.appName || this.dataService.app()?.entity?.name || ''
  );
  public readonly orgName = computed(() =>
    this.seed?.orgName || this.dataService.org()?.entity?.name || ''
  );
  public readonly spaceName = computed(() =>
    this.seed?.spaceName || this.dataService.space()?.entity?.name || ''
  );
  public readonly endpointName = computed(() =>
    this.seed?.endpointName || this.cfEndpointService.endpoint()?.entity?.name || ''
  );

  // Signal-native route + service binding state. Populated by direct HTTP
  // fetches to the native /pp/v1/cf/apps/{cnsi}/{app}/{routes|service_bindings}
  // endpoints in the constructor.
  public appRoutes = signal<StRoute[]>([]);
  public routesLoaded = signal<boolean>(false);
  public appBindings = signal<StServiceBinding[]>([]);
  public bindingsLoaded = signal<boolean>(false);

  public selectedRoutes: StRoute[] = [];
  public selectedServiceBindings: StServiceBinding[] = [];
  // fetchingApplicationData$ drives the top-level loading spinner. Resolves
  // once the app's own fetch completes — the routes + bindings fetches run
  // in parallel and their load flags gate their respective stepper steps.
  public fetchingApplicationData$!: Observable<boolean>;

  public appMonitor!: EntityMonitor<APIResource<IApp>>;

  public cancelUrl: string;

  // The wizard now collects selections only; it does not execute the
  // delete itself. Confirm step's submit stashes selections in
  // AppDeleteSelectionService and navigates back to the app detail page
  // we came from. The detail page (ApplicationBaseComponent) detects the
  // pending request, asks the user "Are you sure?", and runs the
  // orchestrated cleanup + delete via AppApplicationActionsService so the
  // whole sequence renders as one DELETING lifecycle event.
  routesStepHandle: SignalStepHandle = { valid: signal(true).asReadonly() };
  bindingsStepHandle: SignalStepHandle = { valid: signal(true).asReadonly() };
  confirmStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    finishButtonText: signal('Confirm').asReadonly(),
    submit: async () => {
      const { cfGuid, appGuid } = this.applicationService;
      // Read names from the computed signals at submit time — covers both
      // hot path (seed wins) and cold path (data-service-resolved names).
      this.selection.setPending(
        appGuid,
        {
          appName: this.appName(),
          endpointName: this.endpointName(),
          orgName: this.orgName(),
          spaceName: this.spaceName(),
        },
        this.selectedRoutes ?? [],
        this.selectedServiceBindings ?? [],
      );
      this.router.navigate(['/applications', cfGuid, appGuid]);
    },
  };

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
  }

  public redirectToAppWall() {
    this.router.navigate(['/applications']);
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
}
