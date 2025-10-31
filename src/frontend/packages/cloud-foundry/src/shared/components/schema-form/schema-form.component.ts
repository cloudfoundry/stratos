
import { CustomFormFieldComponent } from '@stratosui/core';
import { AfterContentInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

import { safeStringToObj } from '../../../../../core/src/core/utils.service';
import { isValidJsonValidator } from '../../../../../core/src/shared/form-validators';
import { TailwindJsonSchemaFormModule } from '../../../../../core/src/shared/components/tailwind-json-schema-form/tailwind-json-schema-form.module';

// Simple JsonPointer replacement
class JsonPointer {
  static parse(path: any): string[] {
    if (!path) return [];
    const pathStr = path.toString();
    if (pathStr === '') return [];
    if (pathStr === '/') return [''];
    return pathStr.split('/').slice(1);
  }
}

export interface SchemaFormValidationError {
  dataPath: {};
  message: string;
}

export class SchemaFormConfig {
  schema: object;
  initialData?: object;
}

@Component({
  selector: 'app-schema-form',
  templateUrl: './schema-form.component.html',
  styleUrls: ['./schema-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    TailwindJsonSchemaFormModule
],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class SchemaFormComponent implements OnInit, OnDestroy, AfterContentInit {

  mode: 'JSON' | 'schema';
  schemaView: 'schemaForm' | 'schemaJson' = 'schemaForm';
  private schema: object | undefined;

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
        this.pValidChange.next(true);
      }
    } else if (this.mode === 'schema') {
      this.formInitialData = config.initialData;
    }
  }

  @Output()
  dataChange = new EventEmitter<object>();
  pDataChange = new BehaviorSubject<object>(null);

  @Input()
  valid = false;
  @Output()
  validChange = new EventEmitter<boolean>();
  pValidChange = new BehaviorSubject<boolean>(false);


  cleanSchema: object;

  jsonData: object;
  jsonForm: UntypedFormGroup;

  formData: object = {};
  formInitialData: object;
  formValidationErrors: SchemaFormValidationError[];
  formValidationErrorsStr: string;

  subs: Subscription[] = [];

  ngOnInit() {
    this.jsonForm = new UntypedFormGroup({
      json: new UntypedFormControl('', isValidJsonValidator()),
    });
  }

  ngAfterContentInit() {
    this.subs.push(this.jsonForm.controls.json.valueChanges.subscribe(jsonStr => {
      this.jsonData = safeStringToObj(jsonStr);
      this.pDataChange.next(this.jsonData);
      this.pValidChange.next(this.isJsonFormValid());
    }));

    this.subs.push(this.pDataChange.asObservable().pipe(delay(0)).subscribe(data => this.dataChange.emit(data)));
    this.subs.push(this.pValidChange.asObservable().pipe(delay(0)).subscribe(valid => this.validChange.emit(valid)));
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
      this.jsonForm.controls.json.setValue(jsonString);
    }
  }

  private isJsonFormValid(): boolean {
    return !this.jsonForm.controls.json.value || this.jsonForm.controls.json.valid;
  }

  private filterSchema = (schema?: { [key: string]: any }): { [key: string]: any } | null | undefined => {
    if (!schema) {
      return;
    }
    const filterSchema = Object.keys(schema).reduce((obj: { [key: string]: any }, key) => {
      if (key !== '$schema') { obj[key] = schema[key]; }
      return obj;
    }, {});
    return Object.keys(filterSchema).length > 0 ? filterSchema : null;
  };

  onFormChange(formData: object) {
    this.formData = formData;
    this.pDataChange.next(formData);
  }

  onFormValidationErrors(data: SchemaFormValidationError[]): void {
    this.formValidationErrors = data || [];
    this.formValidationErrorsStr = this.prettyValidationErrorsFn(this.formValidationErrors);
    this.pValidChange.next(!this.formValidationErrors.length);
  }

  private prettyValidationErrorsFn = (formValidationErrors: SchemaFormValidationError[]): string | null => {
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
  };

}
