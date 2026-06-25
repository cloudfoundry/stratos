import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { SchemaFormComponent } from './schema-form.component';
import { TailwindSnackBarService } from '@stratosui/core';

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
