import { AfterContentInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { JsonPointer } from 'angular6-json-schema-form';
import { BehaviorSubject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  styleUrls: ['./schema-form.component.scss']
})
export class SchemaFormComponent implements OnInit, OnDestroy, AfterContentInit {

  mode: 'JSON' | 'schema';
  schemaView: 'schemaForm' | 'schemaJson' = 'schemaForm';

  @Input()
  set config(config: SchemaFormConfig) {
    if (!config) {
      return;
    }
    this.cleanSchema = this.filterSchema(config.schema);
    this.mode = this.cleanSchema ? 'schema' : 'JSON';
    if (this.mode === 'JSON') {
      this.setJsonFormData(config.initialData);
      if (!config.initialData) {
        this._validChange.next(true);
      }
    } else if (this.mode === 'schema') {
      // this.formData = config.initialData;
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
      this._validChange.next(!this.jsonForm.controls['json'].value || this.jsonForm.controls['json'].valid);
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
      const jsonString = JSON.stringify(data);
      this.jsonForm.controls['json'].setValue(jsonString);
    }
  }

  private filterSchema = (schema?: object): any => {
    if (!schema) {
      return;
    }
    return Object.keys(schema).reduce((obj, key) => {
      if (key !== '$schema') { obj[key] = schema[key]; }
      return obj;
    }, {});
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
