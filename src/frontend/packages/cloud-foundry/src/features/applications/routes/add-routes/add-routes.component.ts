import { Component, OnDestroy, OnInit, signal , ChangeDetectionStrategy } from '@angular/core';
import { Validators, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, mergeMap, pairwise, switchMap, tap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { domainEntityType, spaceEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { Route, RouteMode } from '../../../../../../cloud-foundry/src/store/types/route.types';
import {
  StepOnNextFunction,
  StepOnNextResult,
} from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { ActionState, RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IDomain } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ApplicationService } from '../../application.service';

import { CustomFormFieldComponent } from '@stratosui/core';
import { CustomSelectComponent, CustomOptionComponent } from '../../../../../../core/src/shared/components/custom-select/custom-select.component';
import { CustomCheckboxComponent } from '../../../../../../core/src/shared/components/custom-checkbox/custom-checkbox.component';
import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { MapRoutesComponent } from '../map-routes/map-routes.component';

const hostPattern = '^([\\w\\-\\.]*)$';
const pathPattern = `^([\\w\\-\\/\\!\\#\\[\\]\\@\\&\\$\\'\\(\\)\\*\\+\\;\\=\\,]*)$`;

interface DomainFormModel {
  domain: APIResource<IDomain> | '';
}

interface HTTPRouteFormModel {
  host: string;
  path: string;
}

interface TCPRouteFormModel {
  port: string;
  useRandomPort: boolean;
}
@Component({
  selector: 'app-add-routes',
  templateUrl: './add-routes.component.html',
  styleUrls: ['./add-routes.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomCheckboxComponent,
    FocusDirective,
    MapRoutesComponent
]
})
export class AddRoutesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  model: Route;
  domains: APIResource<IDomain>[] = [];
  addTCPRoute: FormGroup<{
    port: FormControl<string>;
    useRandomPort: FormControl<boolean>;
  }>;
  addHTTPRoute: FormGroup<{
    host: FormControl<string>;
    path: FormControl<string>;
  }>;
  domainFormGroup: FormGroup<{
    domain: FormControl<APIResource<IDomain> | ''>;
  }>;
  appGuid: string;
  cfGuid: string;
  spaceGuid: string;
  createTCPRoute = false;
  selectedDomain: APIResource<any>;
  private _selectedRoute = signal<any>({
    entity: {},
    metadata: {}
  });
  // Expose as writable object for child component compatibility
  selectedRoute$ = {
    next: (value: any) => this._selectedRoute.set(value),
    subscribe: (fn: any) => toObservable(this._selectedRoute).subscribe(fn)
  } as any;
  appUrl: string;
  isRouteSelected = signal<boolean>(false);
  addRouteModes: RouteMode[] = [
    { id: 'create', label: 'Create and map new route', submitLabel: 'Create' },
    { id: 'map', label: 'Map existing route', submitLabel: 'Map' }
  ];
  addRouteMode: RouteMode;
  useRandomPort = false;
  constructor(
    private applicationService: ApplicationService,
    private store: Store<CFAppState>,
  ) {
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
    this.appUrl = `/applications/${this.cfGuid}/${this.appGuid}/routes`;
    this.addRouteMode = this.addRouteModes[0];
    this.domainFormGroup = new FormGroup({
      domain: new FormControl<APIResource<IDomain> | ''>('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    });

    this.addHTTPRoute = new FormGroup({
      host: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(hostPattern), Validators.maxLength(63)]
      }),
      path: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(pathPattern), Validators.maxLength(128)]
      })
    });

    this.addTCPRoute = new FormGroup({
      port: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern('[0-9]*')
        ]
      }),
      useRandomPort: new FormControl(false, { nonNullable: true })
    });
  }

  appService = this.applicationService;

  ngOnInit() {
    this.subscriptions.push(this.addTCPRoute.valueChanges.subscribe(val => {
      const useRandomPort = val.useRandomPort;
      if (useRandomPort !== this.useRandomPort) {
        this.useRandomPort = useRandomPort;
        const validators = [
          Validators.required,
          Validators.pattern('[0-9]*'),
        ];
        this.addTCPRoute.controls.port.setValidators(useRandomPort ? [] : validators);
        if (useRandomPort) {
          this.addTCPRoute.controls.port.disable();
        } else {
          this.addTCPRoute.controls.port.enable();
        }
      }
    }));

    const space$ = this.applicationService.orgDomains$.pipe(
      // We don't need the domains, but we need them fetched first so we get the router_group_type
      switchMap(() => this.appService.waitForAppEntity$
        .pipe(
          switchMap(app => {
            this.spaceGuid = app.entity.entity.space_guid;
            return cfEntityCatalog.space.store.getEntityService(
              app.entity.entity.space_guid,
              app.entity.entity.cfGuid,
              { includeRelations: [createEntityRelationKey(spaceEntityType, domainEntityType)] }
            ).waitForEntity$;
          }),
          filter(({ entity }) => !!entity.entity.domains),
          tap(({ entity }) => {
            this.domains = [];
            const domains = entity.entity.domains;
            domains.forEach(domain => {
              this.domains.push(domain);
            });
            this.selectedDomain = Object.values(this.domains)[0];
          })
        )
      ));

    this.subscriptions.push(space$.subscribe());

    const selRoute$ = toObservable(this._selectedRoute).subscribe(x => {
      if (x.metadata.guid) {
        this.isRouteSelected.set(true);
      }
    });
    this.subscriptions.push(selRoute$);
  }

  _getValueForKey(key: string, form: any) {
    return form.value[key] ? form.value[key] : '';
  }

  _getValue(key: string, form: any) {
    return form.value[key] !== '' ? form.value[key] : null;
  }

  validate(): boolean {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      return this.isTCPRouteCreation()
        ? this.addTCPRoute.valid
        : this.addHTTPRoute.valid;
    } else {
      try {
        return this.isRouteSelected();
      } catch (e) { }

      return false;
    }
  }

  isTCPRouteCreation(): boolean {
    const domain = this.domainFormGroup.value.domain;
    return !!domain && typeof domain !== 'string' && domain.entity.router_group_type === 'tcp';
  }

  submit: StepOnNextFunction = () => {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      // Creating new route
      return this.onSubmit();
    } else {
      return this.mapRouteSubmit();
    }
  };

  onSubmit(): Observable<StepOnNextResult> {
    const domain = this.domainFormGroup.value.domain;
    const domainGuid = typeof domain !== 'string' ? domain.metadata.guid : '';
    const isTcpRoute = this.isTCPRouteCreation();
    const formGroup = isTcpRoute ? this.addTCPRoute : this.addHTTPRoute;

    // Set port to -1 to indicate that we should generate a random port number
    let port = this._getValue('port', formGroup);
    if (isTcpRoute && this.addTCPRoute.value.useRandomPort) {
      port = -1;
    }

    const newRouteGuid =
      isTcpRoute ? 'tcp_' : 'http_' +
        this._getValueForKey('host', formGroup) +
        this._getValueForKey('port', formGroup) +
        this._getValueForKey('path', formGroup) +
        domainGuid;

    return this.createAndMapRoute(
      newRouteGuid,
      domainGuid,
      this._getValue('host', formGroup),
      this._getValue('path', formGroup),
      port,
      isTcpRoute
    );
  }

  private createAndMapRoute(
    newRouteGuid: string,
    domainGuid: string,
    host: string,
    path: string,
    port: number,
    isTCP: boolean): Observable<StepOnNextResult> {
    if (path && path.length && path[0] !== '/') {
      path = '/' + path;
    }

    return cfEntityCatalog.route.api.create<RequestInfoState>(
      newRouteGuid,
      this.cfGuid,
      new Route(domainGuid, this.spaceGuid, host, path, port)
    ).pipe(
      pairwise(),
      filter(([oldR, newR]) => oldR.creating && !newR.creating),
      map(([, newR]) => newR),
      mergeMap(route => {
        if (route.error) {
          return observableOf({ success: false, message: `Failed to create route: ${route.message}` });
        } else {
          return this.mapRoute(route.response.result[0]);
        }
      })
    );
  }

  private mapRoute(routeGuid: string): Observable<StepOnNextResult> {
    return cfEntityCatalog.application.api.assignRoute<ActionState>(this.cfGuid, routeGuid, this.appGuid).pipe(
      pairwise(),
      filter(([oldR, newR]) => oldR.busy && !newR.busy),
      map(([, newR]) => newR),
      map((requestState: ActionState) => {
        if (requestState.error) {
          return { success: false, message: `Failed to associate route with app: ${requestState.error}` };
        }
        cfEntityCatalog.route.api.getAllForApplication(this.appGuid, this.cfGuid);
        this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid, 'routes'] }));
        return { success: true };
      })
    );
  }

  private mapRouteSubmit(): Observable<StepOnNextResult> {
    return toObservable(this._selectedRoute).pipe(
      switchMap(route => this.mapRoute(route.metadata.guid))
    );
  }

  toggleCreateTCPRoute() {
    this.createTCPRoute = !this.createTCPRoute;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
