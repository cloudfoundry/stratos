import {
  Injectable,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";

export interface JsonSchemaFormData {
  schema?: any;
  data?: any;
  layout?: any[];
  options?: any;
}

export interface JsonSchemaFormConfig {
  addSubmit?: boolean;
  loadExternalAssets?: boolean;
  returnEmptyFields?: boolean;
  setSchemaDefaults?: boolean;
}

@Component({
  selector: "json-schema-form",
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="json-schema-form">
      <div
        class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4"
      >
        <p class="font-bold">Notice:</p>
        <p>
          JSON Schema Form component has been temporarily replaced. Please
          implement form fields manually or use Angular Reactive Forms.
        </p>
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class TailwindJsonSchemaFormComponent implements OnInit {
  @Input() schema: any;
  @Input() data: any;
  @Input() layout!: any[];
  @Input() options: any;
  @Input() framework: string = "tailwind";

  @Output() onChanges = new EventEmitter<any>();
  @Output() onSubmit = new EventEmitter<any>();
  @Output() isValid = new EventEmitter<boolean>();

  ngOnInit(): void {
    // Basic initialization
    if (this.data) {
      this.onChanges.emit(this.data);
    }
    this.isValid.emit(true);
  }

  // Placeholder methods for compatibility
  buildLayout(): any[] {
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
  providedIn: "root",
})
export class TailwindJsonSchemaFormService {
  buildFormData(schema: any, data?: any, layout?: any[]): JsonSchemaFormData {
    return {
      schema,
      data: data || {},
      layout: layout || [],
      options: {},
    };
  }

  validateSchema(schema: any): boolean {
    return schema && typeof schema === "object";
  }

  validateData(_data: any, _schema: any): boolean {
    return true; // Basic validation - should be enhanced
  }
}
