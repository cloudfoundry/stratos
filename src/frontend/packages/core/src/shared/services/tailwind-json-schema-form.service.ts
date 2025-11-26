import { Injectable, Component, Input, Output, EventEmitter, type OnInit } from '@angular/core';

export interface JsonSchemaFormData {
  schema?: unknown;
  data?: unknown;
  layout?: unknown[];
  options?: unknown;
}

export interface JsonSchemaFormConfig {
  addSubmit?: boolean;
  loadExternalAssets?: boolean;
  returnEmptyFields?: boolean;
  setSchemaDefaults?: boolean;
}

@Component({
  selector: 'json-schema-form',
  template: `
    <div class="json-schema-form">
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p class="font-bold">Notice:</p>
        <p>JSON Schema Form component has been temporarily replaced. Please implement form fields manually or use Angular Reactive Forms.</p>
      </div>
      <ng-content></ng-content>
    </div>
  `
})
export class TailwindJsonSchemaFormComponent implements OnInit {
  @Input() schema: unknown;
  @Input() data: unknown;
  @Input() layout!: unknown[];
  @Input() options: unknown;
  @Input() framework: string = 'tailwind';

  @Output() onChanges = new EventEmitter<unknown>();
  @Output() onSubmit = new EventEmitter<unknown>();
  @Output() isValid = new EventEmitter<boolean>();

  ngOnInit(): void {
    // Basic initialization
    if (this.data) {
      this.onChanges.emit(this.data);
    }
    this.isValid.emit(true);
  }

  // Placeholder methods for compatibility
  buildLayout(): unknown[] {
    return this.layout || [];
  }

  validateData(): boolean {
    this.isValid.emit(true);
    return true;
  }

  submitForm(): void {
    this.onSubmit.emit(this.data);
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindJsonSchemaFormService {

  buildFormData(schema: unknown, data?: unknown, layout?: unknown[]): JsonSchemaFormData {
    return {
      schema,
      data: data || {},
      layout: layout || [],
      options: {}
    };
  }

  validateSchema(schema: unknown): boolean {
    return schema && typeof schema === 'object';
  }

  validateData(_data: unknown, _schema: unknown): boolean {
    return true; // Basic validation - should be enhanced
  }
}