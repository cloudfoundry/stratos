import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { take, filter, map, share, startWith, switchMap } from 'rxjs/operators';

import { StepOnNextFunction } from '@stratosui/core';
import { SaveAppOverrides } from '../../../../actions/deploy-applications.actions';
import { CFAppState } from '../../../../cf-app-state';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { OverrideAppDetails, SourceType } from '../../../../store/types/deploy-application.types';
import {
  ApplicationEnvVarsHelper } from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { StDomain, StDomainsResponse, StEnvVars, StStack, StStacksResponse } from '../../../../services/endpoint-data/stratos-types';
import { DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';

interface DeployOptionsForm {
  name: FormControl<string | null>;
  instances: FormControl<number | null>;
  disk_quota: FormControl<number | null>;
  memory: FormControl<number | null>;
  host: FormControl<string | null>;
  domain: FormControl<string | null>;
  path: FormControl<string | null>;
  buildpack: FormControl<string | null>;
  no_route: FormControl<boolean>;
  random_route: FormControl<boolean>;
  no_start: FormControl<boolean>;
  startCmd: FormControl<string | null>;
  healthCheckType: FormControl<string | null>;
  stack: FormControl<string | null>;
  time: FormControl<number | null>;
  dockerImage: FormControl<string | null>;
  dockerUsername: FormControl<string | null>;
}

@Component({
  selector: 'app-deploy-application-options-step',
  templateUrl: './deploy-application-options-step.component.html',
  styleUrls: ['./deploy-application-options-step.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class DeployApplicationOptionsStepComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject<Store<CFAppState>>(Store);
  private http = inject(HttpClient);
  private appEnvVarsService = inject(ApplicationEnvVarsHelper);
  private activatedRoute = inject(ActivatedRoute);
  private deployData = inject(CfDeployAppDataService);
  private deployState$ = toObservable(this.deployData.state);
  private deployCfDetails$ = toObservable(this.deployData.cfDetails);
  private deploySourceType$ = toObservable(this.deployData.sourceType);


  valid$: Observable<boolean>;
  domains$!: Observable<StDomain[]>;
  stacks$!: Observable<StStack[]>;
  deployOptionsForm: FormGroup<DeployOptionsForm>;
  subs: Subscription[] = [];
  appGuid!: string;
  stepOpts: any;

  public healthCheckTypes = ['http', 'port', 'process'];
  public sourceType$!: Observable<SourceType>;
  public DEPLOY_TYPES_IDS = DEPLOY_TYPES_IDS;

  constructor() {
    this.deployOptionsForm = this.fb.group<DeployOptionsForm>({
      name: new FormControl<string | null>(null),
      instances: new FormControl<number | null>(null, [
        Validators.min(0)
      ]),
      disk_quota: new FormControl<number | null>(null, [
        Validators.min(0)
      ]),
      memory: new FormControl<number | null>(null, [
        Validators.min(0)
      ]),
      host: new FormControl<string | null>(null),
      domain: new FormControl<string | null>(null),
      path: new FormControl<string | null>(null),
      buildpack: new FormControl<string | null>(null),
      no_route: new FormControl<boolean>(false, { nonNullable: true }),
      random_route: new FormControl<boolean>(false, { nonNullable: true }),
      no_start: new FormControl<boolean>(false, { nonNullable: true }),
      startCmd: new FormControl<string | null>(null),
      healthCheckType: new FormControl<string | null>(null),
      stack: new FormControl<string | null>(null),
      time: new FormControl<number | null>(null, [
        Validators.min(0)
      ]),
      dockerImage: new FormControl<string | null>(null),
      dockerUsername: new FormControl<string | null>(null)
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
    this.sourceType$ = this.deploySourceType$;

    // Set previously supplied docker values
    this.subs.push(this.deployState$.pipe(
      filter(deployAppState =>
        !!deployAppState &&
        !!deployAppState.applicationSource &&
        !!deployAppState.applicationSource.dockerDetails &&
        !!deployAppState.applicationSource.dockerDetails.applicationName),
    ).subscribe(deployAppState => {
      const sourceType = deployAppState.applicationSource.type;
      if (sourceType.id === DEPLOY_TYPES_IDS.DOCKER_IMG) {
        this.deployOptionsForm.controls.name.setValue(deployAppState.applicationSource.dockerDetails.applicationName ?? null);
        this.deployOptionsForm.controls.dockerImage.setValue(deployAppState.applicationSource.dockerDetails.dockerImage ?? null);
        this.deployOptionsForm.controls.dockerUsername.setValue(deployAppState.applicationSource.dockerDetails.dockerUsername ?? null);
      }
    }));

    const noRouteChanged$ = this.deployOptionsForm.controls.no_route.valueChanges.pipe(startWith(false));
    const randomRouteChanged$ = this.deployOptionsForm.controls.random_route.valueChanges.pipe(startWith(false));

    const cfDetails$ = this.deployCfDetails$.pipe(
      filter(cfDetails => !!cfDetails && !!cfDetails.cloudFoundry)
    );

    // Create the domains list for the domains drop down. cf push overrides
    // do not support tcp routes (no way to specify port), so filter them out.
    this.domains$ = cfDetails$.pipe(
      switchMap(cfDetails => this.http.get<StDomainsResponse>(
        `/pp/v1/cf/org/${cfDetails.cloudFoundry}/${cfDetails.org}/private_domains`,
      )),
      map(resp => (resp?.resources ?? []).filter(d => !d.supportedProtocols?.includes('tcp'))),
      share()
    );

    this.stacks$ = cfDetails$.pipe(
      switchMap(cfDetails => this.http.get<StStacksResponse>(
        `/pp/v1/cf/stacks/${cfDetails.cloudFoundry}`,
      )),
      map(resp => resp?.resources ?? []),
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

    // Extract any existing values from the app's env var and assign to form.
    // Redeploy path: the wizard was launched against an existing app and the
    // STRATOS_PROJECT env var (written by a prior deploy step) carries the
    // overrides we want to preseed.
    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    if (this.appGuid) {
      combineLatest(this.domains$, cfDetails$).pipe(
        switchMap(([, cfDetails]) => this.http.get<StEnvVars>(
          `/pp/v1/cf/apps/${cfDetails.cloudFoundry}/${this.appGuid}/env`,
        )),
        map(env => this.appEnvVarsService.FetchStratosProject(env?.environment)),
        filter((proj): proj is NonNullable<typeof proj> => !!proj),
        take(1)
      ).subscribe(envVars => this.objToForm(envVars.deployOverrides));
    }

  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  formToObj(controls: DeployOptionsForm): OverrideAppDetails {
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
    controls.disk_quota.setValue(parseInt(overrides.diskQuota.replace('MB', ''), 10));
    controls.memory.setValue(parseInt(overrides.memQuota.replace('MB', ''), 10));
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
