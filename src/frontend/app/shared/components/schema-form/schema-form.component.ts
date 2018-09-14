import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { JsonPointer } from 'angular6-json-schema-form';
import { Subscription } from 'rxjs';

import { safeStringToObj } from '../../../core/utils.service';
import { safeUnsubscribe } from '../../../features/service-catalog/services-helper';

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


@Component({
  selector: 'app-schema-form',
  templateUrl: './schema-form.component.html',
  styleUrls: ['./schema-form.component.scss']
})
export class SchemaFormComponent implements OnInit, OnDestroy {

  @Input()
  set schema(schema: object) {
    this.cleanSchema = this.filterSchema(schema);
  }

  @Input()
  data: object = null;

  @Output()
  dataChange = new EventEmitter<object>();

  @Input()
  valid = false;
  @Output()
  validChange = new EventEmitter<boolean>();

  cleanSchema: object;
  view = 'form';

  jsonForm: FormGroup;
  jsonChangeSub: Subscription;

  formData: object = null;
  formValidationErrors: SchemaFormValidationError[];
  formValidationErrorsStr: string;

  ngOnInit() {
    this.jsonForm = new FormGroup({
      json: new FormControl('', isValidJsonValidator()),
    });
    this.jsonChangeSub = this.jsonForm.controls['json'].valueChanges.subscribe(jsonStr => {
      this.data = safeStringToObj(jsonStr);
      this.dataChange.emit(this.data);
      this.validChange.emit(this.jsonForm.controls['json'].valid);
    });
    if (!this.cleanSchema) {
      this.jsonForm.controls['json'].setValue(this.data);
    }
  }

  ngOnDestroy() {
    safeUnsubscribe(this.jsonChangeSub);
  }

  onViewChanged() {
    if (this.view === 'form') {
      this.validChange.emit(!!this.data && !this.formValidationErrors.length);
    } else {
      const jsonString = JSON.stringify(this.data);
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
    this.dataChange.emit(formData);
  }

  onFormValidationErrors(data: SchemaFormValidationError[]): void {
    this.formValidationErrors = data || [];
    this.formValidationErrorsStr = this.prettyValidationErrorsFn(this.formValidationErrors);
    this.validChange.emit(!this.formValidationErrors.length);
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
