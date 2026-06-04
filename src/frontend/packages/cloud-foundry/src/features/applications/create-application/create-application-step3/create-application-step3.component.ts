import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, Observable, of as observableOf, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap } from 'rxjs/operators';

import { AppInputDirective, CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher, StepOnNextFunction } from '@stratosui/core';
import { CnsiAppsSource } from '../../../../services/data-sources/cnsi-apps-source';
import { CnsiRoutesSource } from '../../../../services/data-sources/cnsi-routes-source';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import type { StDomain } from '../../../../services/endpoint-data/stratos-types';
import { CreateAppStateService, NewAppCFDetails } from '../../../../shared/data-services/create-app-state.service';

interface DomainHostForm {
  domain: FormControl<string>;
  host: FormControl<string>;
}

@Component({
  selector: 'app-create-application-step3',
  templateUrl: './create-application-step3.component.html',
  host: { class: 'app-host-flex-1' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class CreateApplicationStep3Component implements OnInit, OnDestroy {
  private createAppState = inject(CreateAppStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private endpointDataRegistry = inject(EndpointDataRegistry);

  setDomainHost: FormGroup<DomainHostForm>;

  // Acquired CNSI guid + acquire-count so destroy releases each acquire
  // exactly once. createApp always acquires; createRoute acquires only
  // when the user supplied a host+domain.
  private acquiredCnsi: string | null = null;
  private acquireCount = 0;

  constructor() {
    this.setDomainHost = new FormGroup({
      domain: new FormControl('', {validators: [Validators.required], nonNullable: true}),
      host: new FormControl('', {validators: [Validators.required, Validators.maxLength(63)], nonNullable: true}) });
    // Disable host control initially - will be enabled when domain is selected
    this.setDomainHost.controls.host.disable();
  }

  domains$!: Observable<StDomain[]>;

  message: any = null;

  newAppData!: { cloudFoundryDetails: NewAppCFDetails; name: string };
  onNext: StepOnNextFunction = () => {
    const { cloudFoundryDetails } = this.newAppData;
    const { cloudFoundry } = cloudFoundryDetails;
    return this.createApp().pipe(
      switchMap(appGuid => this.createRoute().pipe(
        map(routeGuid => ({ appGuid, routeGuid })),
      )),
      switchMap(({ appGuid, routeGuid }) => routeGuid
        ? this.associateRoute(cloudFoundry, appGuid, routeGuid).pipe(map(() => appGuid))
        : observableOf(appGuid),
      ),
      map(appGuid => {
        // When created from a CF-scoped wall, tag the new app's detail page
        // with ?breadcrumbs=cf so its "Applications" breadcrumb returns to the
        // CF-scoped wall rather than the global one.
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        const cfScoped = typeof returnUrl === 'string' && returnUrl.startsWith('/cloud-foundry/');
        this.router.navigate(
          ['applications', cloudFoundry, appGuid, 'summary'],
          cfScoped ? { queryParams: { breadcrumbs: 'cf' } } : undefined,
        );
        return { success: true };
      }),
      catchError((err: Error | HttpErrorResponse) => {
        const message = err instanceof HttpErrorResponse ? this.formatHttpError(err) : err.message;
        return observableOf({ success: false, message });
      }),
    );
  };

  validate(): boolean {
    return this.setDomainHost.valid;
  }

  private createApp(): Observable<string> {
    const { cloudFoundryDetails, name } = this.newAppData;
    const { cloudFoundry, space } = cloudFoundryDetails;
    const eds = this.endpointDataRegistry.acquire(cloudFoundry);
    this.acquiredCnsi = cloudFoundry;
    this.acquireCount++;
    const source = new CnsiAppsSource(cloudFoundry, this.http, eds);
    return from(source.create({
      name,
      relationships: { space: { data: { guid: space } } },
    })).pipe(
      map(app => app.guid),
      this.tagError('Could not create application'),
    );
  }

  private createRoute(): Observable<string | null> {
    const { cloudFoundryDetails } = this.newAppData;
    const { cloudFoundry, space } = cloudFoundryDetails;
    const hostName = this.hostControl().value;
    const selectedDomainGuid = this.domainControl().value;
    if (!selectedDomainGuid || !hostName) {
      return observableOf(null);
    }
    const eds = this.endpointDataRegistry.acquire(cloudFoundry);
    this.acquiredCnsi = cloudFoundry;
    this.acquireCount++;
    const source = new CnsiRoutesSource(cloudFoundry, this.http, eds);
    return from(source.create({
      host: hostName,
      relationships: {
        space: { data: { guid: space } },
        domain: { data: { guid: selectedDomainGuid } },
      },
    })).pipe(
      map(route => route.guid),
      this.tagError('Application created. Could not create route'),
    );
  }

  ngOnDestroy() {
    if (this.acquiredCnsi) {
      for (let i = 0; i < this.acquireCount; i++) {
        this.endpointDataRegistry.release(this.acquiredCnsi);
      }
    }
  }

  private associateRoute(cnsiGuid: string, appGuid: string, routeGuid: string): Observable<void> {
    return this.http.put<void>(
      `/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/routes/${routeGuid}`,
      null,
    ).pipe(this.tagError('Application and route created. Could not associate route with app'));
  }

  // Wraps an HTTP observable so failures bubble out as Error(prefix: detail)
  // — the stepper surfaces .message in the snackbar.
  private tagError<T>(prefix: string): (src: Observable<T>) => Observable<T> {
    return src => src.pipe(
      catchError((err: HttpErrorResponse) => throwError(() => new Error(
        `${prefix}: ${this.formatHttpError(err)}`,
      ))),
    );
  }

  private formatHttpError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.error === 'string') return body.error;
    if (typeof body === 'string') return body;
    return err.message || `HTTP ${err.status}`;
  }

  ngOnInit() {
    this.domains$ = this.createAppState.state$.pipe(
      filter(state => !!state.cloudFoundryDetails?.cloudFoundry && !!state.cloudFoundryDetails?.org),
      mergeMap(state => {
        this.hostControl().setValue(state.name.split(' ').join('-').toLowerCase());
        this.hostControl().markAsDirty();
        this.newAppData = state as { cloudFoundryDetails: NewAppCFDetails; name: string };
        const { cloudFoundry, org } = state.cloudFoundryDetails!;
        return this.http.get<{ resources: StDomain[]; totalResults: number }>(
          `/pp/v1/cf/org/${cloudFoundry}/${org}/private_domains`,
        ).pipe(
          map(resp => {
            const domains = resp?.resources ?? [];
            if (!this.domainControl().value && domains.length) {
              this.domainControl().setValue(domains[0].guid);
              this.hostControl().enable();
            }
            return domains;
          }),
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
