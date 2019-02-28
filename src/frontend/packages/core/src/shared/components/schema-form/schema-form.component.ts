import { AfterContentInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { BehaviorSubject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import { JsonPointer } from 'stratos-angular6-json-schema-form';

import { safeStringToObj } from '../../../core/utils.service';

export interface SchemaFormValidationError {
  dataPath: {};
  message: string;
}

export function isValidJsonValidator(): ValidatorFn {
  return (formField: AbstractControl): { [key: string]: any } => {
    try {
      if (formField.value) {
        const jsonObj = JSON.parse(formField.value);
        // Check if jsonObj is actually an obj
        if (jsonObj.constructor !== {}.constructor) {
          throw new Error('not an object');
        }
      }
    } catch (e) {
      return { 'notValidJson': { value: formField.value } };
    }
    return null;
  };
}

export class SchemaFormConfig {
  schema: object;
  initialData?: object;
}

@Component({
  selector: 'app-schema-form',
  templateUrl: './schema-form.component.html',
  styleUrls: ['./schema-form.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class SchemaFormComponent implements OnInit, OnDestroy, AfterContentInit {

  mode: 'JSON' | 'schema';
  schemaView: 'schemaForm' | 'schemaJson' = 'schemaForm';
  private schema;

  @Input()
  set config(config: SchemaFormConfig) {
    // Skip if no config... or schema is the same (avoids losing existing data in form)
    if (!config || (config.schema && config.schema === this.schema)) {
      return;
    }
    this.schema = config.schema;
    this.cleanSchema = this.filterSchema(config.schema);
    this.mode = this.cleanSchema ? 'schema' : 'JSON';
    if (this.mode === 'JSON') {
      this.setJsonFormData(config.initialData);
      if (!config.initialData) {
        this._validChange.next(true);
      }
    } else if (this.mode === 'schema') {
      this.formInitialData = config.initialData;
    }
  }

  @Output()
  dataChange = new EventEmitter<object>();
  _dataChange = new BehaviorSubject<object>(null);

  @Input()
  valid = false;
  @Output()
  validChange = new EventEmitter<boolean>();
  _validChange = new BehaviorSubject<boolean>(false);


  cleanSchema: object;

  jsonData: object;
  jsonForm: FormGroup;

  formData: object = {};
  formInitialData: object;
  formValidationErrors: SchemaFormValidationError[];
  formValidationErrorsStr: string;

  subs: Subscription[] = [];

  ngOnInit() {
    this.jsonForm = new FormGroup({
      json: new FormControl('', isValidJsonValidator()),
    });
  }

  ngAfterContentInit() {
    this.subs.push(this.jsonForm.controls['json'].valueChanges.subscribe(jsonStr => {
      this.jsonData = safeStringToObj(jsonStr);
      this._dataChange.next(this.jsonData);
      this._validChange.next(this.isJsonFormValid());
    }));

    this.subs.push(this._dataChange.asObservable().pipe(delay(0)).subscribe(data => this.dataChange.emit(data)));
    this.subs.push(this._validChange.asObservable().pipe(delay(0)).subscribe(valid => this.validChange.emit(valid)));
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  onSchemaViewChanged() {
    if (this.schemaView === 'schemaForm') {
      // Copy json into form
      this.formInitialData = this.jsonData;
    } else {
      // Copy form into json
      this.setJsonFormData(this.formData);
    }
  }

  setJsonFormData(data: object) {
    if (this.jsonForm) {
      const jsonString = data ? JSON.stringify(data) : '';
      this.jsonForm.controls['json'].setValue(jsonString);
    }
  }

  private isJsonFormValid(): boolean {
    return !this.jsonForm.controls['json'].value || this.jsonForm.controls['json'].valid;
  }

  private filterSchema = (schema?: object): any => {
    if (!schema) {
      return;
    }
    const filterSchema = Object.keys(schema).reduce((obj, key) => {
      if (key !== '$schema') { obj[key] = schema[key]; }
      return obj;
    }, {});
    return Object.keys(filterSchema).length > 0 ? filterSchema : null;
  }

  onFormChange(formData) {
    this.formData = formData;
    this._dataChange.next(formData);
  }

  onFormValidationErrors(data: SchemaFormValidationError[]): void {
    this.formValidationErrors = data || [];
    this.formValidationErrorsStr = this.prettyValidationErrorsFn(this.formValidationErrors);
    this._validChange.next(!this.formValidationErrors.length);
  }

  private prettyValidationErrorsFn = (formValidationErrors: SchemaFormValidationError[]): string => {
    if (!formValidationErrors) {
      return null;
    }
    return formValidationErrors.reduce((a, c) => {
      const arrMessage = JsonPointer.parse(c.dataPath).reduce((aa, cc) => {
        const dd = /^\d+$/.test(cc) ? `[${cc}]` : `.${cc}`;
        return aa + dd;
      }, '');
      return `${a} ${arrMessage} ${c.message} <br>`;
    }, '');
  }

}
