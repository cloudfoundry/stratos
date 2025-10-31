import { Injectable } from '@angular/core';
import { FormGroupDirective, NgForm, FormBuilder, FormControl } from '@angular/forms';

export interface ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TailwindErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched || (form && form.submitted)));
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindShowOnDirtyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindDefaultErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched || (form && form.submitted)));
  }
}

// Export the interface under the expected name for compatibility
export interface ShowOnDirtyErrorStateMatcher extends ErrorStateMatcher {}