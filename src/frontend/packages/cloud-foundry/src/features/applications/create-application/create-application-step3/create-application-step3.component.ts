import { Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { type AbstractControl, ReactiveFormsModule, FormControl, FormGroup, Validators, } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, type Observable, of as observableOf } from 'rxjs';
import { catchError, filter, first, map, mergeMap, pairwise, switchMap, tap } from 'rxjs/operators';
import type { GeneralEntityAppState } from '@stratosui/store';

import { CustomFormFieldComponent, AppInputDirective, AppErrorComponent, CustomSelectComponent, CustomOptionComponent, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher, type StepOnNextFunction } from '@stratosui/core';
import { RouterNav, type ActionState, getDefaultRequestState, type RequestInfoState, type APIResource, type EntityInfo } from '@stratosui/store';
import { type CFAppState, domainEntityType, organizationEntityType } from '@stratosui/cloud-foundry';
import type { IDomain, IOrganization } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { createEntityRelationKey } from '../../../../entity-relations/entity-relations.types';
import { createGetApplicationAction } from '../../application.service';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import type { CreateNewApplicationState } from '../../../../store/types/create-application.types';

interface DomainHostForm {
  domain: FormControl<string>;
  host: FormControl<string>;
}

@Component({
  selector: 'app-create-application-step3',
  templateUrl: './create-application-step3.component.html',
  styleUrls: ['./create-application-step3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    AppInputDirective,
    AppErrorComponent,
    CustomSelectComponent,
    CustomOptionComponent
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class CreateApplicationStep3Component implements OnInit {
  private store = inject(Store<GeneralEntityAppState>);

  setDomainHost: FormGroup<DomainHostForm>;

  constructor() {
    this.setDomainHost = new FormGroup({
      domain: new FormControl('', {validators: [Validators.required], nonNullable: true}),
      host: new FormControl('', {validators: [Validators.required, Validators.maxLength(63)], nonNullable: true}),
    });
    // Disable host control initially - will be enabled when domain is selected
    this.setDomainHost.controls.host.disable();
  }

  domains$!: Observable<APIResource<IDomain>[] | undefined>;

  message: string | null = null;

  newAppData!: CreateNewApplicationState;
  onNext: StepOnNextFunction = () => {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry } = cloudFoundryDetails;
    return this.createApp().pipe(
      switchMap(app => {
        return combineLatest(
          observableOf(app),
          this.createRoute()
        );
      }),
      switchMap(([app, route]: [RequestInfoState, RequestInfoState]) => {
        // Did we create a route?
        const createdRoute = !app.error && !route.error && route.message !== 'NO_ROUTE';
        // Then assign it to the application
        const obs$ = createdRoute ?
          this.associateRoute((app.response as any).result[0], (route.response as any).result[0], cloudFoundry) :
          observableOf(null);
        return obs$.pipe(
          map(() => (app.response as any).result[0] as string)
        );
      }),
      map(appGuid => {
        this.store.dispatch(createGetApplicationAction(appGuid, cloudFoundry));
        this.store.dispatch(new RouterNav({ path: ['applications', cloudFoundry, appGuid, 'summary'] }));
        return { success: true };
      }),
      catchError((err: Error) => {
        return observableOf({ success: false, message: err.message });
      })
    );
  };

  validate(): boolean {
    return this.setDomainHost.valid;
  }

  createApp(): Observable<RequestInfoState> {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry, space } = cloudFoundryDetails;
    const newAppGuid = name + space;

    const obs$ = cfEntityCatalog.application.api.create<RequestInfoState>(
      newAppGuid,
      cloudFoundry, {
      name,
      space_guid: space
    });
    return this.wrapObservable(obs$, 'Could not create application');
  }

  createRoute(): Observable<RequestInfoState> {
    const { cloudFoundryDetails } = this.newAppData;

    const { cloudFoundry, space } = cloudFoundryDetails;
    const hostName = this.hostControl().value;
    const selectedDomainGuid = this.domainControl().value;
    const shouldCreate = selectedDomainGuid && hostName;
    const newRouteGuid = hostName + selectedDomainGuid;

    if (shouldCreate) {
      const obs$ = cfEntityCatalog.route.api.create<RequestInfoState>(
        newRouteGuid,
        cloudFoundry,
        {
          space_guid: space,
          domain_guid: selectedDomainGuid,
          host: hostName
        }
      );
      return this.wrapObservable(obs$, 'Application created. Could not create route');
    }
    return observableOf({
      ...getDefaultRequestState(),
      message: 'NO_ROUTE'
    });
  }

  associateRoute(appGuid: string, routeGuid: string, endpointGuid: string): Observable<RequestInfoState> {
    const obs$ = cfEntityCatalog.application.api.assignRoute<ActionState>(endpointGuid, routeGuid, appGuid).pipe(
      map((actionState: ActionState): RequestInfoState => ({
        creating: actionState.busy,
        error: actionState.error,
        message: actionState.message,
        fetching: null,
        updating: null,
        deleting: null,
        response: null
      }))
    );
    return this.wrapObservable(obs$, 'Application and route created. Could not associated route with app');
  }

  private wrapObservable(obs$: Observable<RequestInfoState>, errorString: string): Observable<RequestInfoState> {
    return obs$.pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.creating && !newS.creating),
      map(([, newS]) => newS),
      first(),
      tap(state => {
        if (state.error) {
          const fullErrorString = errorString + (state.message ? `: ${state.message}` : '');
          throw new Error(fullErrorString);
        }
      })
    );
  }

  ngOnInit() {
    this.domains$ = this.store.select(selectNewAppState).pipe(
      filter(state => !!state.cloudFoundryDetails?.cloudFoundry && !!state.cloudFoundryDetails?.org && !!state.cloudFoundryDetails?.space),
      mergeMap(state => {
        this.hostControl().setValue(state.name.split(' ').join('-').toLowerCase());
        this.hostControl().markAsDirty();
        this.newAppData = state;

        return cfEntityCatalog.org.store.getEntityService(
          state.cloudFoundryDetails.org,
          state.cloudFoundryDetails.cloudFoundry,
          {
            includeRelations: [createEntityRelationKey(organizationEntityType, domainEntityType)],
            populateMissing: true
          }
        ).waitForEntity$.pipe(
          map(({ entity }: EntityInfo<APIResource<IOrganization>>) => {
            if (!this.domainControl().value && entity.entity.domains && entity.entity.domains.length) {
              this.domainControl().setValue(entity.entity.domains[0].metadata.guid);
              this.hostControl().enable();
            }
            return entity.entity.domains;
          })
        );
      })
    );
  }

  private domainControl(): AbstractControl {
    return this.setDomainHost.controls.domain;
  }

  private hostControl(): AbstractControl {
    return this.setDomainHost.controls.host;
  }

}
