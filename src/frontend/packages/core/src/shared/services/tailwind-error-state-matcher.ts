import { UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';

export interface TailwindErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean;
}

export class TailwindShowOnDirtyErrorStateMatcher implements TailwindErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

export class TailwindDefaultErrorStateMatcher implements TailwindErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched || (form && form.submitted)));
  }
}