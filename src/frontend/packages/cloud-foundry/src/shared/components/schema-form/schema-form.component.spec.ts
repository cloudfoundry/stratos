import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { SchemaFormComponent } from './schema-form.component';
import { MonacoEditorComponent, TailwindSnackBarService } from '@stratosui/core';

describe('SchemaFormComponent', () => {
  let component: SchemaFormComponent;
  let fixture: ComponentFixture<SchemaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('SchemaFormComponent advisory validity', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }));

  it('emits valid=true for schema-invalid-but-parseable JSON (broker decides)', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    let lastValid = false;
    c.validChange.subscribe((v: boolean) => (lastValid = v));
    c.config = { schema: { type: 'object', properties: { size: { type: 'integer' } } } };
    fixture.detectChanges();
    c.setJsonText('{"size":"5"}');           // type mismatch — must NOT block
    await fixture.whenStable();
    expect(lastValid).toBe(true);
    expect(c.warnings().length).toBeGreaterThan(0); // but surfaced as a warning
  });

  it('emits valid=false only for unparseable JSON', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    let lastValid = true;
    c.validChange.subscribe((v: boolean) => (lastValid = v));
    c.config = { schema: { type: 'object' } };
    fixture.detectChanges();
    c.setJsonText('{ not json');
    await fixture.whenStable();
    expect(lastValid).toBe(false);
  });
});

describe('SchemaFormComponent render error fallback', () => {
  let snackBarSpy: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarSpy = { error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [SchemaFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TailwindSnackBarService, useValue: snackBarSpy },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('auto-switches to JSON view, sets renderError, and calls snackbar on onRenderError()', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    // Set schema mode so the schema-form branch is active
    c.config = { schema: { type: 'object', properties: { x: { type: 'string' } } } };
    fixture.detectChanges();

    const msg = 'This plan\'s parameter schema could not be rendered as a form (boom). Edit the parameters directly as JSON below — the broker validates them on submit.';
    c.onRenderError(msg);
    // flush the queueMicrotask
    await Promise.resolve();
    fixture.detectChanges();

    expect(c.schemaView()).toBe('schemaJson');
    expect(c.renderError()).toContain('Edit the parameters directly as JSON');
    expect(snackBarSpy.error).toHaveBeenCalledWith(msg);

    // inline notice renders in the DOM
    const notice = fixture.nativeElement.querySelector('[data-testid="render-error-notice"]');
    expect(notice).toBeTruthy();
    expect(notice.textContent).toContain('Edit the parameters directly as JSON');
  });

  it('seeds jsonText with formInitialData when render error fires', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.formInitialData = { key: 'value' };
    c.onRenderError('Schema failed');
    await Promise.resolve();
    fixture.detectChanges();
    expect(c.jsonText).toContain('key');
  });

  it('does not overwrite jsonText already set when render error fires', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.formInitialData = { key: 'value' };
    c.jsonText = '{"existing":"data"}';
    c.onRenderError('Schema failed');
    await Promise.resolve();
    fixture.detectChanges();
    expect(c.jsonText).toBe('{"existing":"data"}');
  });

  it('shows schema title and description in the render-error notice when present', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {
      schema: {
        title: 'DB params',
        description: 'Connection settings for the database.',
        type: 'object',
        properties: { host: { type: 'string' } },
      },
    };
    fixture.detectChanges();

    c.onRenderError('Could not render form.');
    await Promise.resolve();
    fixture.detectChanges();

    const notice = fixture.nativeElement.querySelector('[data-testid="render-error-notice"]');
    expect(notice).toBeTruthy();
    expect(notice.textContent).toContain('DB params');
    expect(notice.textContent).toContain('Connection settings for the database.');
  });

  it('bails out when the view is destroyed before the deferred callback runs', async () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    fixture.detectChanges();

    c.onRenderError('Schema failed');
    fixture.destroy();          // tear down before the queued microtask fires
    await Promise.resolve();    // flush the microtask

    expect(c.schemaView()).toBe('schemaForm'); // never switched
    expect(c.renderError()).toBeNull();        // never set
    expect(snackBarSpy.error).not.toHaveBeenCalled(); // no overlay on a gone portal
  });
});

describe('SchemaFormComponent Form-to-JSON toggle', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }));

  afterEach(() => TestBed.resetTestingModule());

  it('copies data() into jsonText when switching from Form to JSON view', () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {
      schema: {
        type: 'object',
        properties: {
          region: { type: 'string' },
          size: { type: 'integer' },
          network: { type: 'object', properties: { subnet: { type: 'string' } } },
        },
      },
    };
    fixture.detectChanges();

    // Simulate the form filling in data (as the SchemaWidgetRenderer would)
    c.onFormChange({ region: 'us-west', size: 3, network: { subnet: 'x' } });

    // Switch to JSON view the same way the radio input does
    c.schemaView.set('schemaJson');
    c.onSchemaViewChanged();

    expect(c.jsonText).toBe(JSON.stringify(c.data(), null, 2));
  });

  it('seeds a schema key-skeleton into the JSON view when no params are set', () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {
      schema: {
        type: 'object',
        properties: {
          region: { type: 'string' },
          size: { type: 'integer' },
          network: { type: 'object', properties: { subnet: { type: 'string' } } },
        },
      },
    };
    fixture.detectChanges();

    // No data entered — toggle to JSON the way the radio does
    c.schemaView.set('schemaJson');
    c.onSchemaViewChanged();

    // Editor shows every key (unset placeholders) so the user sees the structure…
    expect(c.jsonText).toBe(JSON.stringify({ region: '', size: null, network: { subnet: '' } }, null, 2));
    // …but the untouched skeleton submits no params (all stripped).
    expect(c.data()).toBeNull();
  });

  it('shows all fields on Form→JSON with a set value overlaid on the skeleton', () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {
      schema: {
        type: 'object',
        properties: {
          region: { type: 'string' },
          size: { type: 'integer' },
          network: { type: 'object', properties: { subnet: { type: 'string' } } },
        },
      },
    };
    fixture.detectChanges();

    // User sets one field in the form, then flips to JSON
    c.onFormChange({ region: 'us-west' });
    c.schemaView.set('schemaJson');
    c.onSchemaViewChanged();

    // JSON shows the set value AND the remaining empty fields…
    expect(c.jsonText).toBe(JSON.stringify({ region: 'us-west', size: null, network: { subnet: '' } }, null, 2));
    // …while only the set value is submitted.
    expect(c.data()).toEqual({ region: 'us-west' });
  });

  it('seeds a freshly-mounted editor with current jsonText via onMonacoInit', () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {
      schema: { type: 'object', properties: { key: { type: 'string' } } },
    };
    fixture.detectChanges();

    // Populate data via form, then flip to JSON (sets jsonText)
    c.onFormChange({ key: 'hello' });
    c.schemaView.set('schemaJson');
    c.onSchemaViewChanged();

    // Simulate Monaco mounting AFTER jsonText was already set (the race the bug triggered)
    const setValueSpy = vi.fn();
    const fakeEditor = {
      getValue: () => '',                        // editor starts empty (no ngModel binding seeds it)
      setValue: setValueSpy,
    } as unknown as MonacoEditorComponent;
    c.onMonacoInit(fakeEditor);

    // onMonacoInit must have pushed the current jsonText into the editor
    expect(setValueSpy).toHaveBeenCalledWith(c.jsonText);
    expect(c.jsonText).toBe(JSON.stringify({ key: 'hello' }, null, 2));
  });

  it('does not call setValue when the editor already has the correct text (loop guard)', () => {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {
      schema: { type: 'object', properties: { key: { type: 'string' } } },
    };
    fixture.detectChanges();

    c.onFormChange({ key: 'hello' });
    c.schemaView.set('schemaJson');
    c.onSchemaViewChanged();

    const expectedText = JSON.stringify({ key: 'hello' }, null, 2);
    const setValueSpy = vi.fn();
    const fakeEditor = {
      getValue: () => expectedText,              // editor already has the correct text
      setValue: setValueSpy,
    } as unknown as MonacoEditorComponent;
    c.onMonacoInit(fakeEditor);

    // No redundant setValue — editor is already up to date
    expect(setValueSpy).not.toHaveBeenCalled();
  });
});

describe('SchemaFormComponent editor text changes', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }));

  afterEach(() => TestBed.resetTestingModule());

  // Emit through the mounted child's valueChange output so the test exercises
  // the template's (valueChange)="setJsonText($event)" binding itself — the
  // only channel editor edits reach the component through. Driving setJsonText
  // directly would stay green with the binding deleted.
  async function mountRawJsonEditor(): Promise<{
    fixture: ComponentFixture<SchemaFormComponent>;
    c: SchemaFormComponent;
    editor: MonacoEditorComponent;
  }> {
    const fixture = TestBed.createComponent(SchemaFormComponent);
    const c = fixture.componentInstance;
    c.config = {};                               // no schema — raw JSON mode
    fixture.detectChanges();
    await fixture.whenStable();                  // mocked Monaco finishes mounting

    const editorDe = fixture.debugElement.query(By.directive(MonacoEditorComponent));
    expect(editorDe).toBeTruthy();               // raw JSON mode rendered an editor
    return { fixture, c, editor: editorDe.componentInstance };
  }

  it('updates data() and parseValid from an editor text change', async () => {
    const { c, editor } = await mountRawJsonEditor();

    editor.valueChange.emit('{"region":"us-west"}');
    expect(c.parseValid()).toBe(true);
    expect(c.data()).toEqual({ region: 'us-west' });
  });

  it('flags parseValid=false when the editor emits unparseable JSON', async () => {
    const { c, editor } = await mountRawJsonEditor();

    editor.valueChange.emit('{ not json');
    expect(c.parseValid()).toBe(false);
    expect(c.data()).toBeNull();                 // never fed a bad parse
  });
});
