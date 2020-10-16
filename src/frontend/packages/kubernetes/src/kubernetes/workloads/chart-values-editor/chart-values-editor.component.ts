import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { JsonSchemaFormComponent } from '@cfstratos/ajsf-core';
import * as yaml from 'js-yaml';
import { BehaviorSubject, combineLatest, fromEvent, Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, filter, map, startWith, tap } from 'rxjs/operators';

import { ConfirmationDialogConfig } from '../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { ThemeService } from '../../../../../store/src/theme.service';
import { diffObjects } from './diffvalues';
import { generateJsonSchemaFromObject } from './json-schema-generator';
import { mergeObjects } from './merge';


export interface ChartValuesConfig {

  // URL of the JSON Schema for the chart values
  schemaUrl: string;

  // URL of the Chart Values
  valuesUrl: string;

  // Values for the current release (optional)
  releaseValues?: string;
}

// Height of the toolbar that sits above the editor conmponent
const TOOLBAR_HEIGHT = 40;

// Editor modes - can be either using the form or the code editor
enum EditorMode {
  CodeEditor = 'editor',
  JSonSchemaForm = 'form',
}

@Component({
  selector: 'app-chart-values-editor',
  templateUrl: './chart-values-editor.component.html',
  styleUrls: ['./chart-values-editor.component.scss']
})
export class ChartValuesEditorComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() set config(config: ChartValuesConfig) {
    if (!!config) {
      this.schemaUrl = config.schemaUrl;
      this.valuesUrl = config.valuesUrl;
      this.releaseValues = config.releaseValues;
      this.init();
    }
  }

  schemaUrl: string;
  valuesUrl: string;
  releaseValues: string;

  // Model for the editor - we set this once when the YAML support has been loaded
  public model;

  // Editor mode - either 'editor' for the Monaco Code Editor or 'form' for the JSON Schema Form editor
  public mode: EditorMode = EditorMode.CodeEditor;

  // Content shown in the code editor
  public code = '';

  // JSON Schema
  public schema: any;

  public hasSchema = false;

  // Data shown in the form on load
  public initialFormData = {};

  // Data updated in the form as the user changes it
  public formData = {};

  // Is the YAML in the code editor invalid?
  public yamlError = false;

  // Monaco Code Editor settings
  public minimap = true;
  public lineNumbers = true;

  // Chart Values - as both raw text (keeping comments) and parsed JSON
  public chartValuesYaml: string;
  public chartValues: any;

  // Default Monaco options
  public editorOptions = {
    automaticLayout: false, // We will resize the editor to fit the available space
    contextmenu: false, // Turn off the right-click context menu
    tabSize: 2,
  };

  // Monaco editor
  public editor: any;

  // Observable - are we still loading resources?
  public loading$: Observable<boolean>;

  public initing = true;

  // Observable for tracking if the Monaco editor has loaded
  private monacoLoaded$ = new BehaviorSubject<boolean>(false);

  private resizeSub: Subscription;
  private themeSub: Subscription;

  // Track whether the user changes the code in the text editor
  private codeOnEnter: string;

  // Reference to the editor, so we can adjust its size to fit
  @ViewChild('monacoEditor', { read: ElementRef }) monacoEditor: ElementRef;

  @ViewChild('schemaForm') schemaForm: JsonSchemaFormComponent;

  // Confirmation dialog - copy values
  overwriteValuesConfirmation = new ConfirmationDialogConfig(
    'Overwrite Values?',
    'Are you sure you want to replace your values with those from values.yaml?',
    'Overwrite'
  );

  // Confirmation dialog - copy release values
  overwriteReleaseValuesConfirmation = new ConfirmationDialogConfig(
    'Overwrite Values?',
    'Are you sure you want to replace your values with those from the release?',
    'Overwrite'
  );

  // Confirmation dialog - diff values
  overwriteDiffValuesConfirmation = new ConfirmationDialogConfig(
    'Overwrite Values?',
    'Are you sure you want to replace your values with the diff with values.yaml?',
    'Overwrite'
  );

  // Confirmation dialog - clear values
  clearValuesConfirmation = new ConfirmationDialogConfig(
    'Clear Values?',
    'Are you sure you want to clear the form values?',
    'Overwrite'
  );

  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private httpClient: HttpClient,
    private themeService: ThemeService,
    private confirmDialog: ConfirmationDialogService,
  ) { }

  ngOnInit(): void {
    // Listen for window resize and resize the editor when this happens
    this.resizeSub = fromEvent(window, 'resize').pipe(debounceTime(150)).subscribe(event => this.resize());
  }

  private init() {
    // Observabled for loading schema and values for the Chart
    const schema$ = this.httpClient.get(this.schemaUrl).pipe(catchError(e => of(null)));
    const values$: Observable<string | unknown> = this.httpClient.get(this.valuesUrl, { responseType: 'text' }).pipe(
      catchError(e => of(null))
    );

    // We need the schame, value sand the monaco editor to be all loaded before we're ready
    this.loading$ = combineLatest(schema$, values$, this.monacoLoaded$).pipe(
      filter(([schema, values, loaded]) => schema !== undefined && values !== undefined && loaded),
      tap(([schema, values, loaded]) => {
        this.schema = schema;
        if (values !== null) {
          this.chartValuesYaml = values as string;
          this.chartValues = yaml.safeLoad(values, { json: true });
          // Set the form to the chart values initially, so if the user does nothing, they get the defaults
          this.initialFormData = this.chartValues;
        }
        // Default to form if there is a schema
        if (schema !== null) {
          this.hasSchema = true;
          this.mode = EditorMode.JSonSchemaForm;
          // Register schema with the Monaco editor
          this.registerSchema(this.schema);
        } else {
          // No Schema, so register an auto-generated schema from the Chart's values
          this.registerSchema(generateJsonSchemaFromObject('Generated Schema', this.chartValues));

          // Inherit the previous values if available (upgrade)
          if (this.releaseValues) {
            this.code = yaml.safeDump(this.releaseValues);
          }
        }
        this.updateModel();
      }),
      map(([schema, values, loaded]) => !loaded),
      startWith(true)
    );

    this.initing = false;
  }

  ngAfterViewInit(): void {
    this.resizeEditor();
  }

  ngOnDestroy(): void {
    if (this.resizeSub) {
      this.resizeSub.unsubscribe();
    }
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  // Toggle editor minimap on/off
  toggleMinimap() {
    this.minimap = !this.minimap;
    this.editor.updateOptions({ minimap: { enabled: this.minimap } });
  }

  // Toggle editor line numbers on/off
  toggleLineNumbers() {
    this.lineNumbers = !this.lineNumbers;
    this.editor.updateOptions({ lineNumbers: this.lineNumbers ? 'on' : 'off' });
  }

  // Store the update form data when the form changes
  // AJSF two-way binding seems to cause issues
  formChanged(data: any) {
    this.formData = data;
  }

  // The edit mode has changed (form or editor)
  editModeChanged(mode) {
    this.mode = mode.value;

    if (this.mode === EditorMode.CodeEditor) {
      // Form -> Editor
      // Only copy if there is not an error - otherwise keep the invalid yaml from the editor that needs fixing
      if (!this.yamlError) {
        const codeYaml = yaml.safeLoad(this.code || '{}', { json: true });
        const data = mergeObjects(codeYaml, this.formData);
        this.code = this.getDiff(data);
        this.codeOnEnter = this.code;
      }

      // Need to resize the editor, as it will be freshly shown
      this.resizeEditor();
    } else {
      // Editor -> Form
      // Try and parse the YAML - if we can't this is an error, so we can't edit this back in the form
      try {
        if (this.codeOnEnter === this.code) {
          // Code did not change
          return;
        }

        // Parse as json
        const json = yaml.safeLoad(this.code || '{}', { json: true });
        // Must be an object, otherwise it was not valid
        if (typeof (json) !== 'object') {
          throw new Error('Invalid YAML');
        }
        this.yamlError = false;
        const data = mergeObjects(this.formData, json);
        this.initialFormData = data;
        this.formData = data;
      } catch (e) {
        // The yaml in the code editor is invalid, so we can't marshal it back to json for the from editor
        this.yamlError = true;
      }
    }
  }

  // Called once the Monaco editor has loaded and then each time the model is update
  // Store a reference to the editor and ensure the editor theme is synchronized with the Stratos theme
  onMonacoInit(editor) {
    this.editor = editor;
    this.resize();

    // Only load the YAML support once - when we set the model, onMonacoInit will et
    if (this.model) {
      return;
    }

    // Load the YAML Language support - require is available as it will have been loaded by the Monaco vs loader
    const req = (window as any).require;
    req(['vs/language/yaml/monaco.contribution'], () => {
      // Set the model now that YAML support is loaded - this will update the editor correctly
      this.updateModel();
      this.monacoLoaded$.next(true);
    });

    // Watch for theme changes - set light/dark theme in the monaco editor as the Stratos theme changes
    this.themeSub = this.themeService.getTheme().subscribe(theme => {
      const monaco = (window as any).monaco;
      const monacoTheme = (theme.styleName === 'dark-theme') ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(monacoTheme);
    });
  }

  private updateModel() {
    this.model = {
      language: 'yaml',
      uri: this.getSchemaUri()
    };
  }

  // Delayed resize of editor to fit
  resizeEditor() {
    setTimeout(() => this.resize(), 1);
  }

  // Resize editor to fit
  resize() {
    // Return if resize before editor has been set
    if (!this.editor) {
      return;
    }

    // Get width and height of the host element
    const w = this.elRef.nativeElement.offsetWidth;
    let h = this.elRef.nativeElement.offsetHeight;

    // Check if host element not visible (does not have a size)
    if ((w === 0) && (h === 0)) {
      return;
    }

    // Remove height of toolbar (since this is incluced in the height of the host element)
    h = h - TOOLBAR_HEIGHT;

    // Set the Monaco editor to the same size as the container
    this.renderer.setStyle(this.monacoEditor.nativeElement, 'width', `${w}px`);
    this.renderer.setStyle(this.monacoEditor.nativeElement, 'height', `${h}px`);

    // Ask Monaco to layout again with its new size
    this.editor.layout();
  }

  // Get an absolute URI for the Schema - it is not fetched, just used as a reference
  // schemaUrl is a relative URL - e.g. /p1/v1/chartsvc....
  getSchemaUri(): string {
    return `https://stratos.app/schemas${this.schemaUrl}`;
  }

  // Register the schema with the Monaco editor
  // Reference: https://github.com/pengx17/monaco-yaml/blob/master/examples/umd/index.html#L69
  registerSchema(schema: any) {
    const monaco = (window as any).monaco;
    monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      hover: true,
      completion: true,
      validate: true,
      format: true,
      schemas: [
        {
          uri: this.getSchemaUri(),
          fileMatch: [this.getSchemaUri()],
          schema
        }
      ]
    });
  }

  public getValues(): object {
    // Always diff the form with the Chart Values to get only the changes that the user has made
    return (this.mode === EditorMode.JSonSchemaForm) ? diffObjects(this.formData, this.chartValues) : yaml.safeLoad(this.code);
  }

  public copyValues() {
    const confirm = this.mode === EditorMode.JSonSchemaForm || this.mode === EditorMode.CodeEditor && this.code.length > 0;
    if (confirm) {
      this.confirmDialog.open(this.overwriteValuesConfirmation, () => {
        this.doCopyValues();
      });
    } else {
      this.doCopyValues();
    }
  }

  // Copy the chart values into either the form or the code editor, depending on the current mode
  private doCopyValues() {
    if (this.mode === EditorMode.JSonSchemaForm) {
      this.initialFormData = this.chartValues;
    } else {
      // Use the raw Yaml, so we keep comments and formatting
      this.code = this.chartValuesYaml;
    }
  }

  public copyReleaseValues() {
    const confirm = this.mode === EditorMode.JSonSchemaForm || this.mode === EditorMode.CodeEditor && this.code.length > 0;
    if (confirm) {
      this.confirmDialog.open(this.overwriteReleaseValuesConfirmation, () => {
        this.doCopyReleaseValues();
      });
    } else {
      this.doCopyReleaseValues();
    }
  }

  // Copy the release values into either the form or the code editor, depending on the current mode
  private doCopyReleaseValues() {
    if (this.mode === EditorMode.JSonSchemaForm) {
      this.initialFormData = this.releaseValues;
    } else {
      this.code = yaml.safeDump(this.releaseValues);
    }
  }

  // Reset the form values and the code
  clearFormValues() {
    this.confirmDialog.open(this.clearValuesConfirmation, () => {
      this.initialFormData = {};
      this.code = '';
      this.codeOnEnter = '';
    });
  }

  // Update the code editor to only show the YAML that contains the differences with the values.yaml
  diff() {
    this.confirmDialog.open(this.overwriteDiffValuesConfirmation, () => {
      const userValues = yaml.safeLoad(this.code, { json: true });
      this.code = this.getDiff(userValues);
    });
  }

  getDiff(userValues: any): string {
    let code = yaml.safeDump(diffObjects(userValues, this.chartValues));
    if (code.trim() === '{}') {
      code = '';
    }
    return code;
  }
}
