import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { SchemaFormComponent } from './schema-form.component';

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
