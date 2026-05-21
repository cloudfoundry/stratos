import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@stratosui/store';
import { Observable, of as observableOf, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap } from 'rxjs/operators';

import { CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher, StepOnNextFunction } from '@stratosui/core';
import { RouterNav } from '@stratosui/store';
import { CFAppState } from '@stratosui/cloud-foundry';
import type { StApp, StDomain, StRoute } from '../../../../services/endpoint-data/stratos-types';
import { selectNewAppState } from '../../../../store/selectors/create-application.selectors';
import { CreateNewApplicationState } from '../../../../store/types/create-application.types';

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
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class CreateApplicationStep3Component implements OnInit {
  private store = inject(Store<CFAppState>);
  private http = inject(HttpClient);

  setDomainHost: FormGroup<DomainHostForm>;

  constructor() {
    this.setDomainHost = new FormGroup({
      domain: new FormControl('', {validators: [Validators.required], nonNullable: true}),
      host: new FormControl('', {validators: [Validators.required, Validators.maxLength(63)], nonNullable: true}) });
    // Disable host control initially - will be enabled when domain is selected
    this.setDomainHost.controls.host.disable();
  }

  domains$!: Observable<StDomain[]>;

  message: any = null;

  newAppData!: CreateNewApplicationState;
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
        this.store.dispatch(new RouterNav({ path: ['applications', cloudFoundry, appGuid, 'summary'] }));
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
    return this.http.post<StApp>(`/pp/v1/cf/apps/${cloudFoundry}`, {
      name,
      relationships: { space: { data: { guid: space } } },
    }).pipe(
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
    return this.http.post<StRoute>(`/pp/v1/cf/routes/${cloudFoundry}`, {
      host: hostName,
      relationships: {
        space: { data: { guid: space } },
        domain: { data: { guid: selectedDomainGuid } },
      },
    }).pipe(
      map(route => route.guid),
      this.tagError('Application created. Could not create route'),
    );
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
    this.domains$ = this.store.select(selectNewAppState).pipe(
      filter(state => !!state.cloudFoundryDetails?.cloudFoundry && !!state.cloudFoundryDetails?.org),
      mergeMap(state => {
        this.hostControl().setValue(state.name.split(' ').join('-').toLowerCase());
        this.hostControl().markAsDirty();
        this.newAppData = state;
        const { cloudFoundry, org } = state.cloudFoundryDetails;
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
