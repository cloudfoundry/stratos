import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, of, of as observableOf, firstValueFrom } from 'rxjs';
import { take, filter, map, tap } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

import { SourceType } from '../../../store/types/deploy-application.types';
import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';
import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { AUTO_SELECT_CF_URL_PARAM } from '../new-application-base-step/new-application-base-step.component';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { PageHeaderComponent, SignalStepHandle, SteppersComponent, StepComponent } from '@stratosui/core';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep21Component } from './deploy-application-step2-1/deploy-application-step2-1.component';
import { DeployApplicationStepSourceUploadComponent } from './deploy-application-step-source-upload/deploy-application-step-source-upload.component';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step/deploy-application-options-step.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  providers: [
    CfOrgSpaceDataService,
    ApplicationDeploySourceTypes,
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    DeployApplicationStep2Component,
    DeployApplicationStep21Component,
    DeployApplicationStepSourceUploadComponent,
    DeployApplicationOptionsStepComponent,
    DeployApplicationStep3Component
]
})
export class DeployApplicationComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private appsConfig = inject(CfAppsSignalConfigService);
  private activatedRoute = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private deployData = inject(CfDeployAppDataService);
  private cfDetails$ = toObservable(this.deployData.cfDetails);


  appGuid: string;
  initCfOrgSpaceService: Subscription[] = [];
  deployButtonText = 'Deploy';
  skipConfig$: Observable<boolean> = observableOf(false);
  isRedeploy: boolean;
  selectedSourceType$: Observable<SourceType>;

  // Reactive deploy button text — switches to "Redeploy" when the
  // wizard is invoked with an existing appGuid. Step 4's handle reads
  // this signal so changing the field once at construction time
  // cascades into the rendered button label.
  private deployButtonTextSignal = signal<string>('Deploy');

  // FWT-959 Part 2 (Partition B): SignalStepHandle wiring for the
  // deploy-application flow (up to 6 steps). Cross-step state continues
  // to live in deploy-application.actions selectors + the per-component
  // ApplicationDeploySourceTypes provider — children read/write it via
  // the existing surface.
  //
  // The steppers component renders only the active step's content
  // template at any given time (steppers.component.html line 71:
  // `<span *ngTemplateOutlet="steps[currentIndex].content">`), so child
  // components are instantiated lazily on activation. We use ViewChild
  // *setters* so the bridge subscription is wired the moment the child
  // becomes available — and torn down when the user navigates away.
  //
  // Step 1 (Cloud Foundry) is conditionally rendered via @if (!appGuid)
  // — a true template guard — so its handle never wires up when the
  // user is redeploying. Steps 2_1 and 2_2 use legacy [hidden] bindings
  // (still served by the @Input fall-through) for source-type-driven
  // visibility; the legacy [skip]="step2_2.skip$ | async" binding on
  // step2_2 was a no-op (the child has no skip$ field) and has been
  // removed in the migration.
  private _step1?: CreateApplicationStep1Component;
  private _step2?: DeployApplicationStep2Component;
  private _step2_1?: DeployApplicationStep21Component;
  private _step2_2?: DeployApplicationStepSourceUploadComponent;
  private _step4?: DeployApplicationOptionsStepComponent;
  private _step3?: DeployApplicationStep3Component;

  private step1Valid = signal<boolean>(false);
  private step2Valid = signal<boolean>(false);
  private step2_1Valid = signal<boolean>(false);
  private step2_2Valid = signal<boolean>(false);
  private step4Valid = signal<boolean>(false);
  private step3Valid = signal<boolean>(false);
  private step3Closeable = signal<boolean>(false);
  private step3DisablePrevious = signal<boolean>(true);

  private step1Sub?: Subscription;
  private step2Sub?: Subscription;
  private step2_1Sub?: Subscription;
  private step2_2Sub?: Subscription;
  private step4Sub?: Subscription;
  private step3ValidSub?: Subscription;
  private step3CloseableSub?: Subscription;
  private step3DisablePrevSub?: Subscription;

  // Carries the deployer instance forward from step2_2 (source-upload)
  // to step3 (deploy progress). The legacy stepper relayed this via
  // `enterData` between step.onNext.data → next step.onEnter(enterData);
  // signal-handle submit() drops the `data` channel, so the parent
  // captures it explicitly here. step2_2's submit stores the deployer,
  // step3Handle.onEnter forwards it to step3.onEnter on activation.
  private pendingDeployer?: unknown;
  // FileScannerInfo from step2's source-select onNext, consumed by
  // step2_2Handle.onEnter to prime deployer.fsFileInfo. Without this,
  // the file-upload deploy path never opens the deploy WebSocket because
  // deployer.open()'s readyFilter falls into the git/docker branch (which
  // requires gitDetails or dockerDetails). The legacy stepper relayed
  // step2's onNext.data into step2_2.onEnter via enterData.
  private pendingFsFileInfo?: unknown;

  private isLoadingSignal = this.cfOrgSpaceService.isLoading;

  @ViewChild('step1', { static: false })
  set step1Ref(v: CreateApplicationStep1Component | undefined) {
    this._step1 = v;
    this.step1Sub?.unsubscribe();
    this.step1Sub = undefined;
    if (v) {
      this.step1Sub = v.validate.subscribe(valid => {
        this.step1Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step1Valid.set(false);
    }
  }

  @ViewChild('step2', { static: false })
  set step2Ref(v: DeployApplicationStep2Component | undefined) {
    this._step2 = v;
    this.step2Sub?.unsubscribe();
    this.step2Sub = undefined;
    if (v) {
      this.step2Sub = v.validate.subscribe(valid => {
        this.step2Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step2Valid.set(false);
    }
  }

  @ViewChild('step2_1', { static: false })
  set step2_1Ref(v: DeployApplicationStep21Component | undefined) {
    this._step2_1 = v;
    this.step2_1Sub?.unsubscribe();
    this.step2_1Sub = undefined;
    if (v) {
      // Replicate the legacy [onEnter]="step2_1.onEnter" binding so the
      // child re-validates against the SCM commit selection on entry.
      v.onEnter();
      this.step2_1Sub = v.validate.subscribe(valid => {
        this.step2_1Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step2_1Valid.set(false);
    }
  }

  @ViewChild('step2_2', { static: false })
  set step2_2Ref(v: DeployApplicationStepSourceUploadComponent | undefined) {
    this._step2_2 = v;
    this.step2_2Sub?.unsubscribe();
    this.step2_2Sub = undefined;
    if (v) {
      // Subscription wiring only. The activation-time `onEnter` call that
      // primes `deployer.fsFileInfo` lives on `step2_2Handle.onEnter` — it
      // fires when the stepper navigates *into* this step, after step 2's
      // submit has populated `pendingFsFileInfo`. Calling `v.onEnter` here
      // (on view-init) would run with `pendingFsFileInfo === undefined`
      // because `<app-step [hidden]>` keeps step 2_2 instantiated up-front,
      // so the setter fires before step 2 ever submits.
      this.step2_2Sub = v.valid$.subscribe(valid => {
        this.step2_2Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step2_2Valid.set(false);
    }
  }

  @ViewChild('step4', { static: false })
  set step4Ref(v: DeployApplicationOptionsStepComponent | undefined) {
    this._step4 = v;
    this.step4Sub?.unsubscribe();
    this.step4Sub = undefined;
    if (v) {
      // Replicate the legacy [onEnter]="step4.onEnter" — the options step
      // re-evaluates its form on entry (resets / merges manifest-derived
      // defaults). The framework would normally pass deployer info as
      // `data` — see comment on step2_2 for why we pass undefined.
      v.onEnter(undefined);
      this.step4Sub = v.valid$.subscribe(valid => {
        this.step4Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step4Valid.set(false);
    }
  }

  @ViewChild('step3', { static: false })
  set step3Ref(v: DeployApplicationStep3Component | undefined) {
    this._step3 = v;
    this.step3ValidSub?.unsubscribe();
    this.step3CloseableSub?.unsubscribe();
    this.step3DisablePrevSub?.unsubscribe();
    this.step3ValidSub = undefined;
    this.step3CloseableSub = undefined;
    this.step3DisablePrevSub = undefined;
    if (v) {
      // Subscription wiring only. The activation-time `onEnter` call that
      // forwards `pendingDeployer` lives on `step3Handle.onEnter` — see the
      // `step2_2Ref` comment above for why the ViewChild-time call was the
      // wrong hook.
      this.step3ValidSub = v.valid$.subscribe(valid => {
        this.step3Valid.set(!!valid);
        this.cdr.markForCheck();
      });
      this.step3CloseableSub = v.closeable$.subscribe(c => {
        this.step3Closeable.set(!!c);
        this.cdr.markForCheck();
      });
      this.step3DisablePrevSub = v.disablePrevious$.subscribe(d => {
        this.step3DisablePrevious.set(!!d);
        this.cdr.markForCheck();
      });
    } else {
      this.step3Valid.set(false);
      this.step3Closeable.set(false);
      this.step3DisablePrevious.set(true);
    }
  }

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    blocked: computed(() => !!this.isLoadingSignal()),
    submit: async () => {
      // The legacy template wired step 1's submit to the *parent*'s
      // onNext — push the picker selections into the deploy-data
      // service so downstream steps (step 2, options) can read them.
      this.deployData.setCfDetails({
        cloudFoundry: this.cfOrgSpaceService.cf.select(),
        org: this.cfOrgSpaceService.org.select(),
        space: this.cfOrgSpaceService.space.select(),
      });
    },
  };

  step2Handle: SignalStepHandle = {
    valid: this.step2Valid.asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this._step2!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save source type');
      }
      // Capture the FileScannerInfo for step2_2 to consume on activation
      // (file-upload path only — git-url/docker source paths leave data
      // undefined and step2_2 isn't navigated to).
      this.pendingFsFileInfo = result.data;
    },
  };

  step2_1Handle: SignalStepHandle = {
    valid: this.step2_1Valid.asReadonly(),
    onLeave: () => this._step2_1?.onLeave(),
    submit: async () => {
      const result = await firstValueFrom(this._step2_1!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save source config');
      }
    },
  };

  step2_2Handle: SignalStepHandle = {
    valid: this.step2_2Valid.asReadonly(),
    // Activation-time hand-off of step 2's captured FileScannerInfo into
    // the source-upload component. Has to run on each entry (not just on
    // ViewChild init) so re-entries after a Previous click also re-prime
    // the freshly-constructed deployer. See `step2_2Ref` comment for the
    // ViewChild-fires-once trap this avoids.
    onEnter: () => {
      this._step2_2?.onEnter(this.pendingFsFileInfo as any);
      this.pendingFsFileInfo = undefined;
    },
    onLeave: (isNext?: boolean) => this._step2_2?.onLeave(!!isNext),
    submit: async () => {
      const result = await firstValueFrom(this._step2_2!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload source');
      }
      // Capture the deployer so step 3 picks it up on activation —
      // mirrors the legacy enterData hand-off the framework no longer
      // performs for signal-handle submits.
      this.pendingDeployer = result.data;
    },
  };

  step4Handle: SignalStepHandle = {
    valid: this.step4Valid.asReadonly(),
    nextButtonText: this.deployButtonTextSignal.asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this._step4!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save deploy options');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: this.step3Valid.asReadonly(),
    // Activation-time hand-off of step 2_2's deployer. Same rationale as
    // `step2_2Handle.onEnter` — ViewChild-time would run with
    // `pendingDeployer === undefined`. Source types that bypass step 2_2
    // (git-url, docker-image) leave pendingDeployer undefined and step 3
    // instantiates a fresh deployer.
    onEnter: () => {
      const deployer = this.pendingDeployer;
      this.pendingDeployer = undefined;
      this._step3?.onEnter(deployer as any);
    },
    canClose: this.step3Closeable.asReadonly(),
    disablePrevious: this.step3DisablePrevious.asReadonly(),
    // step3.busy and step3.disablePrevious$ are both fed by the same
    // `status.deploying` signal inside step 3 (see lines ~123-128 of
    // deploy-application-step3.component.ts), so we derive showBusy
    // from the same local signal rather than polling step3.busy.
    showBusy: this.step3DisablePrevious.asReadonly(),
    cancelButtonText: signal('Close').asReadonly(),
    finishButtonText: signal('Go to App Summary').asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this._step3!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Deploy failed');
      }
    },
  };

  constructor() {
    const activatedRoute = this.activatedRoute;
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);

    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    this.isRedeploy = !!this.appGuid;

    this.selectedSourceType$ = appDeploySourceTypes.getAutoSelectedType(activatedRoute);

    this.skipConfig$ = toObservable(this.deployData.applicationSource).pipe(
      map(appSource => appSource?.type?.id === 'giturl'),
    );

    if (this.isRedeploy) {
      this.deployButtonText = 'Redeploy';
      this.deployButtonTextSignal.set('Redeploy');
    }
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.forEach(p => p.unsubscribe());
    this.step1Sub?.unsubscribe();
    this.step2Sub?.unsubscribe();
    this.step2_1Sub?.unsubscribe();
    this.step2_2Sub?.unsubscribe();
    this.step4Sub?.unsubscribe();
    this.step3ValidSub?.unsubscribe();
    this.step3CloseableSub?.unsubscribe();
    this.step3DisablePrevSub?.unsubscribe();
  }

  ngOnInit(): void {
    // Has the endpoint ID been specified in the URL?
    const endpoint = this.activatedRoute.snapshot.queryParams[AUTO_SELECT_CF_URL_PARAM];
    if (endpoint) {
      this.cfOrgSpaceService.cf.select.set(endpoint);
    }

    if (this.appGuid) {
      this.initCfOrgSpaceService.push(this.cfDetails$.pipe(
        filter(p => !!p),
        tap(p => {
          this.cfOrgSpaceService.cf.select.set(p.cloudFoundry);
          this.cfOrgSpaceService.org.select.set(p.org);
          this.cfOrgSpaceService.space.select.set(p.space);
        })
      ).subscribe());
      // In case user has specified the query param manually
      this.initCfOrgSpaceService.push(this.cfDetails$.pipe(
        filter(p => !p),
        tap(_p => {
          this.router.navigate(['applications', 'deploy']);
        })
      ).subscribe());
    } else {
      // Auto-select endpoint/org/space from the apps wall's current filter
      // (root-scoped CfAppsSignalConfigService keeps them in signals — read
      // directly instead of round-tripping through ngrx pagination state).
      const cf = this.appsConfig.selectedCnsi();
      const org = this.appsConfig.selectedOrg();
      const space = this.appsConfig.selectedSpace();
      if (cf) {
        this.cfOrgSpaceService.cf.select.set(cf);
      }
      if (org) {
        this.cfOrgSpaceService.org.select.set(org);
      }
      if (space) {
        this.cfOrgSpaceService.space.select.set(space);
      }
      // Delete any state in deployApplication
      this.deployData.resetState();
    }
  }

  getTitle = (): Observable<string> => {
    if (this.appGuid) {
      return of('Redeploy');
    }
    return this.selectedSourceType$.pipe(
      take(1),
      map(selectedSourceType => `Deploy ${selectedSourceType ? 'from ' + selectedSourceType.name : ''}`)
    );
  };
}
