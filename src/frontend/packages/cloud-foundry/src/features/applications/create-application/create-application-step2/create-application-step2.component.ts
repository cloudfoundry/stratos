
import { Component, type OnInit, inject, } from '@angular/core';
import { FormsModule, ReactiveFormsModule,FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';
import type { GeneralEntityAppState } from '@stratosui/store';

import { CustomFormFieldComponent, AppInputDirective, AppErrorComponent, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher, StatefulIconComponent, type StepOnNextFunction } from '@stratosui/core';
import type { CFAppState } from '@stratosui/cloud-foundry';
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
    AppInputDirective,
    AppErrorComponent,
    AppNameUniqueDirective,
    StatefulIconComponent
  ]
})
export class CreateApplicationStep2Component implements OnInit {
  private store = inject(Store<GeneralEntityAppState>);

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
