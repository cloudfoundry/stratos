import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework";
import { FileInputComponent } from './file-input.component';

describe('FileInputComponent', () => {
  let component: FileInputComponent;
  let fixture: ComponentFixture<FileInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection()
      ],
      imports: [
        ...BaseTestModulesNoShared,
        FileInputComponent,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const pathField = () => (fixture.nativeElement as HTMLElement).querySelector('input[type="text"]');

  it('names the path field after the placeholder it is given', async () => {
    fixture.componentRef.setInput('placeholder', 'kubeconfig');
    await fixture.whenStable();
    expect(pathField()?.getAttribute('aria-label')).toBe('kubeconfig');
  });

  // The stock placeholder says no file is chosen; that is a state, not a name.
  it('names the path field File when it is given no placeholder', () => {
    expect(pathField()?.getAttribute('placeholder')).toBe('No file selected');
    expect(pathField()?.getAttribute('aria-label')).toBe('File');
  });
});
