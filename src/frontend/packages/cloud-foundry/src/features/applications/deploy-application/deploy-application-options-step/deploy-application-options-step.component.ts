import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, first, map, share, startWith, switchMap } from 'rxjs/operators';

import { SaveAppOverrides } from '../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  selectCfDetails,
  selectDeployAppState,
  selectSourceType,
} from '../../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import { OverrideAppDetails, SourceType } from '../../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IDomain } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import {
  ApplicationEnvVarsHelper,
} from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';

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
  public sourceType$: Observable<SourceType>;
  public DEPLOY_TYPES_IDS = DEPLOY_TYPES_IDS;

  constructor(
    private fb: FormBuilder,
    private store: Store<CFAppState>,
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
      dockerImage: null,
      dockerUsername: null
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
    this.sourceType$ = this.store.select(selectSourceType);

    // Set previously supplied docker values
    this.subs.push(this.store.select(selectDeployAppState).pipe(
      filter(deployAppState =>
        !!deployAppState &&
        !!deployAppState.applicationSource &&
        !!deployAppState.applicationSource.dockerDetails &&
        !!deployAppState.applicationSource.dockerDetails.applicationName),
    ).subscribe(deployAppState => {
      const sourceType = deployAppState.applicationSource.type;
      if (sourceType.id === DEPLOY_TYPES_IDS.DOCKER_IMG) {
        this.deployOptionsForm.controls.name.setValue(deployAppState.applicationSource.dockerDetails.applicationName);
        this.deployOptionsForm.controls.dockerImage.setValue(deployAppState.applicationSource.dockerDetails.dockerImage);
        this.deployOptionsForm.controls.dockerUsername.setValue(deployAppState.applicationSource.dockerDetails.dockerUsername);
      }
    }));

    const noRouteChanged$ = this.deployOptionsForm.controls.no_route.valueChanges.pipe(startWith(false));
    const randomRouteChanged$ = this.deployOptionsForm.controls.random_route.valueChanges.pipe(startWith(false));

    const cfDetails$ = this.store.select(selectCfDetails).pipe(
      filter(cfDetails => !!cfDetails && !!cfDetails.cloudFoundry)
    );

    // Create the domains list for the domains drop down
    this.domains$ = cfDetails$.pipe(
      switchMap(cfDetails =>
        cfEntityCatalog.domain.store.getOrganizationDomains.getPaginationService(cfDetails.org, cfDetails.cloudFoundry).entities$
      ),
      // cf push overrides do not support tcp routes (no way to specify port)
      map(domains => domains.filter(domain => domain.entity.router_group_type !== 'tcp')),
      share()
    );

    this.stacks$ = cfDetails$.pipe(
      switchMap(cfDetails => cfEntityCatalog.stack.store.getPaginationService(null, cfDetails.cloudFoundry).entities$),
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
    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    if (this.appGuid) {
      combineLatest(this.domains$, cfDetails$).pipe(
        switchMap(([, cfDetails]) => this.appEnvVarsService.createEnvVarsObs(this.appGuid, cfDetails.cloudFoundry).entities$),
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
      time: controls.time.value,
      dockerImage: controls.dockerImage.value,
      dockerUsername: controls.dockerUsername.value
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
    controls.dockerImage.setValue(overrides.dockerImage);
    controls.dockerUsername.setValue(overrides.dockerUsername);
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
