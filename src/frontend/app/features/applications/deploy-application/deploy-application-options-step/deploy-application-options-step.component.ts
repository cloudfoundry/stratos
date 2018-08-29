import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription, of as observableOf } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AppState } from '../../../../store/app-state';
import { SaveAppOverrides } from '../../../../store/actions/deploy-applications.actions';
import { OverrideAppDetails } from '../../../../store/types/deploy-application.types';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';

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
  deployOptionsForm: FormGroup;
  subs: Subscription[] = [];

  constructor(private fb: FormBuilder, private store: Store<AppState>) {
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
      no_start: false
    });
    this.valid$ = this.deployOptionsForm.valueChanges.pipe(
      map(() => this.deployOptionsForm.valid),
      startWith(this.deployOptionsForm.valid)
    );
  }

  ngOnInit() {
    const noRouteChanged$ = this.deployOptionsForm.controls.no_route.valueChanges.pipe(startWith(false));
    const randomRouteChanged$ = this.deployOptionsForm.controls.random_route.valueChanges.pipe(startWith(false));

    this.subs.push(noRouteChanged$.subscribe(value => {
      if (value) {
        this.deployOptionsForm.controls.host.disable();
        this.deployOptionsForm.controls.domain.disable();
        this.deployOptionsForm.controls.path.disable();
        this.deployOptionsForm.controls.random_route.disable();
      } else {
        this.deployOptionsForm.controls.host.enable();
        this.deployOptionsForm.controls.domain.enable();
        this.deployOptionsForm.controls.path.enable();
        this.deployOptionsForm.controls.random_route.enable();
      }
    }));
    this.subs.push(combineLatest([
      noRouteChanged$,
      randomRouteChanged$
    ]).subscribe(([noRoute, randomRoute]) => {
      // control.valueChanges fires whenever the value ... or enabled/disabled state changes. This means whenever noRouteChanged$ changes
      // randomRoute this also fires ... which undos the host+domain state
      if (noRoute || randomRoute) {
        this.deployOptionsForm.controls.host.disable();
        this.deployOptionsForm.controls.domain.disable();
        this.deployOptionsForm.controls.path.disable();
      } else {
        this.deployOptionsForm.controls.host.enable();
        this.deployOptionsForm.controls.domain.enable();
        this.deployOptionsForm.controls.path.enable();
      }
    }));
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
      path: controls.path.value
    };
  }

  objToForm(obj: OverrideAppDetails) {
    // TODO: RC store in stratos env var. fetch from env var
  }

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SaveAppOverrides(this.formToObj(this.deployOptionsForm.controls)));
    return observableOf({
      success: true
    });
  }
}
