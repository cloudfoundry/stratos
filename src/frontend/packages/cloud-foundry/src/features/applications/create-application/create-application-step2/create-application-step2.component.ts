
import { CustomFormFieldComponent } from '@stratosui/core';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { StatefulIconComponent } from '../../../../../../core/src/core/stateful-icon/stateful-icon.component';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { SetNewAppName } from '../../../../../../cloud-foundry/src/actions/create-applications-page.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppNameUniqueChecking, AppNameUniqueDirective } from '../../../../shared/directives/app-name-unique.directive/app-name-unique.directive';

@Component({
selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    AppNameUniqueDirective,
    StatefulIconComponent
]
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<CFAppState>, private fb: UntypedFormBuilder) { }

  form: UntypedFormGroup;

  validate: Observable<boolean>;

  appName = new UntypedFormControl();
  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetNewAppName(this.appName.value));
    return observableOf({ success: true });
  }

  onEnter = () => {
    this.appName.updateValueAndValidity();
  }

  ngOnInit() {
    this.form = new UntypedFormGroup({ appName: this.appName });
    this.validate = this.form.statusChanges.pipe(
      map(() => {
        return this.form.valid;
      }));
  }

}
