
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule,FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { CustomFormFieldComponent, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher, StatefulIconComponent, StepOnNextFunction } from '@stratosui/core';
import { CFAppState } from '@stratosui/cloud-foundry';
import { SetNewAppName } from '../../../../actions/create-applications-page.actions';
import { AppNameUniqueChecking, AppNameUniqueDirective } from '../../../../shared/directives/app-name-unique.directive/app-name-unique.directive';

interface CreateApplicationForm {
  appName: FormControl<string | null>;
}

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
  private store = inject(Store<CFAppState>);
  private fb = inject(FormBuilder);

  form!: FormGroup<CreateApplicationForm>;

  validate!: Observable<boolean>;

  appName = new FormControl<string | null>(null);
  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetNewAppName(this.appName.value ?? ''));
    return observableOf({ success: true });
  }

  onEnter = () => {
    this.appName.updateValueAndValidity();
  }

  ngOnInit() {
    this.form = new FormGroup<CreateApplicationForm>({ appName: this.appName });
    this.validate = this.form.statusChanges.pipe(
      map(() => {
        return this.form.valid;
      }));
  }

}
