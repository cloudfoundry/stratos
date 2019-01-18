import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, first, map, share, startWith, switchMap } from 'rxjs/operators';

import { IDomain } from '../../../../core/cf-api.types';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SaveAppOverrides } from '../../../../store/actions/deploy-applications.actions';
import { FetchAllDomains } from '../../../../store/actions/domains.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, stackSchemaKey } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCfDetails } from '../../../../store/selectors/deploy-application.selector';
import { APIResource } from '../../../../store/types/api.types';
import { OverrideAppDetails } from '../../../../store/types/deploy-application.types';
import {
  ApplicationEnvVarsHelper,
} from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { GetAllStacks } from '../../../../store/actions/stack.action';

@Component({
  selector: 'app-deploy-application-options-step',
  templateUrl: './deploy-application-options-step.component.html',
  styleUrls: ['./deploy-application-options-step.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class DeployApplicationOptionsStepComponent implements OnInit, OnDestroy {

  valid$: Observable<boolean>;
  domains$: Observable<APIResource<IDomain>[]>;
  stacks$: Observable<APIResource<IDomain>[]>;
  deployOptionsForm: FormGroup;
  subs: Subscription[] = [];
  appGuid: string;
  stepOpts: any;

  public healthCheckTypes = ['http', 'port', 'process'];

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private appEnvVarsService: ApplicationEnvVarsHelper,
    private activatedRoute: ActivatedRoute
  ) {
    this.deployOptionsForm = this.fb.group({
      name: null,
      instances: [null, [
        Validators.min(0)
      ]],
      disk_quota: [null, [
        Validators.min(0)
      ]],
      memory: [null, [
        Validators.min(0)
      ]],
      host: null,
      domain: null,
      path: null,
      buildpack: null,
      no_route: false,
      random_route: false,
      no_start: false,
      startCmd: null,
      healthCheckType: null,
      stack: null,
      time: [null, [
        Validators.min(0)
      ]],
    });
    this.valid$ = this.deployOptionsForm.valueChanges.pipe(
      map(() => this.deployOptionsForm.valid),
      startWith(this.deployOptionsForm.valid)
    );
  }

  private disableAddressFields() {
    this.deployOptionsForm.controls.host.disable();
    this.deployOptionsForm.controls.domain.disable();
    this.deployOptionsForm.controls.path.disable();
  }

  private enableAddressFields() {
    this.deployOptionsForm.controls.host.enable();
    this.deployOptionsForm.controls.domain.enable();
    this.deployOptionsForm.controls.path.enable();
  }

  ngOnInit() {
    const noRouteChanged$ = this.deployOptionsForm.controls.no_route.valueChanges.pipe(startWith(false));
    const randomRouteChanged$ = this.deployOptionsForm.controls.random_route.valueChanges.pipe(startWith(false));

    const cfDetails$ = this.store.select(selectCfDetails).pipe(
      filter(cfDetails => !!cfDetails && !!cfDetails.cloudFoundry)
    );

    // Create the domains list for the domains drop down
    this.domains$ = cfDetails$.pipe(
      switchMap(cfDetails => {
        const action = new FetchAllDomains(cfDetails.cloudFoundry);
        return getPaginationObservables<APIResource<IDomain>>(
          {
            store: this.store,
            action,
            paginationMonitor: this.paginationMonitorFactory.create(
              action.paginationKey,
              entityFactory(action.entityKey)
            )
          },
          true
        ).entities$;
      }),
      // cf push overrides do not support tcp routes (no way to specify port)
      map(domains => domains.filter(domain => domain.entity.router_group_type !== 'tcp')),
      share()
    );

    this.stacks$ = cfDetails$.pipe(
      switchMap(cfDetails => {
        const action = new GetAllStacks(cfDetails.cloudFoundry);
        return getPaginationObservables<APIResource<IDomain>>(
          {
            store: this.store,
            action,
            paginationMonitor: this.paginationMonitorFactory.create(
              action.paginationKey,
              entityFactory(action.entityKey)
            )
          },
          true
        ).entities$;
      }),
      share()
    );

    // Ensure that when the no route + random route options are checked the host, domain and path fields are enabled/disabled
    this.subs.push(noRouteChanged$.subscribe(value => {
      if (value) {
        this.disableAddressFields();
        this.deployOptionsForm.controls.random_route.disable();
      } else {
        this.enableAddressFields();
        if (!this.appGuid) {
          // This can only be enabled if this is not a redeploy
          this.deployOptionsForm.controls.random_route.enable();
        }
      }
    }));
    this.subs.push(combineLatest([
      noRouteChanged$,
      randomRouteChanged$
    ]).subscribe(([noRoute, randomRoute]) => {
      // control.valueChanges fires whenever the value ... or enabled/disabled state changes. This means whenever noRouteChanged$ changes
      // randomRoute this also fires ... which undos the host+domain state
      if (noRoute || randomRoute) {
        this.disableAddressFields();
      } else {
        this.enableAddressFields();
      }
    }));

    // Extract any existing values from the app's env var and assign to form
    this.appGuid = this.activatedRoute.snapshot.queryParams['appGuid'];
    if (this.appGuid) {
      combineLatest(this.domains$, cfDetails$).pipe(
        switchMap(([domains, cfDetails]) => this.appEnvVarsService.createEnvVarsObs(this.appGuid, cfDetails.cloudFoundry).entities$),
        map(applicationEnvVars => this.appEnvVarsService.FetchStratosProject(applicationEnvVars[0].entity)),
        first()
      ).subscribe(envVars => this.objToForm(envVars.deployOverrides));
    }

  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  formToObj(controls: {
    [key: string]: AbstractControl;
  }): OverrideAppDetails {
    return {
      name: controls.name.value,
      buildpack: controls.buildpack.value,
      instances: controls.instances.value,
      diskQuota: controls.disk_quota.value ? controls.disk_quota.value + 'MB' : null,
      memQuota: controls.memory.value ? controls.memory.value + 'MB' : null,
      doNotStart: controls.no_start.value,
      noRoute: controls.no_route.value,
      randomRoute: controls.random_route.value,
      host: controls.host.value,
      domain: controls.domain.value,
      path: controls.path.value,
      startCmd: controls.startCmd.value,
      healthCheckType: controls.healthCheckType.value,
      stack: controls.stack.value,
      time: controls.time.value
    };
  }

  objToForm(overrides: OverrideAppDetails) {
    const controls = this.deployOptionsForm.controls;
    controls.name.setValue(overrides.name);
    // If we have existing values this is a re-deploy. As such don't allow the app name to change (making it a new app on deploy)
    controls.name.disable();
    controls.buildpack.setValue(overrides.buildpack);
    controls.instances.setValue(overrides.instances);
    controls.disk_quota.setValue(overrides.diskQuota.replace('MB', ''));
    controls.memory.setValue(overrides.memQuota.replace('MB', ''));
    controls.no_start.setValue(overrides.doNotStart);
    controls.no_route.setValue(overrides.noRoute);
    // Random route has no affect on redeploy, so disable.
    controls.random_route.disable();
    // Don't repopulate route fields with previous route setting. Editing might suggest existing route is changed instead of new route
    // created
    controls.startCmd.setValue(overrides.startCmd);
    controls.healthCheckType.setValue(overrides.healthCheckType);
    controls.stack.setValue(overrides.stack);
    controls.time.setValue(overrides.time);
  }

  onEnter = (opts: any) => {
    this.stepOpts = opts;
  }

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SaveAppOverrides(this.formToObj(this.deployOptionsForm.controls)));
    return observableOf({
      success: true, data: this.stepOpts
    });
  }
}
