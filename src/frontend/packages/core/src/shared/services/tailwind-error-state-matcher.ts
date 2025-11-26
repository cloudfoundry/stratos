import { Injectable } from '@angular/core';
import type {FormControl} from '@angular/forms';
import type {FormGroupDirective, NgForm} from '@angular/forms';

// Base interface for error state matchers
export interface IErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TailwindErrorStateMatcher implements IErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.invalid && (control.dirty || control.touched || (form?.submitted)));
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindShowOnDirtyErrorStateMatcher implements IErrorStateMatcher {
  isErrorState(control: FormControl | null, _form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.invalid && (control.dirty || control.touched));
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindDefaultErrorStateMatcher implements IErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.invalid && (control.dirty || control.touched || (form?.submitted)));
  }
}

// Export class implementations with the Material-compatible names for provider usage
// This allows them to be used as both types and values (for DI providers)
export { TailwindErrorStateMatcher as ErrorStateMatcher };
export { TailwindShowOnDirtyErrorStateMatcher as ShowOnDirtyErrorStateMatcher };