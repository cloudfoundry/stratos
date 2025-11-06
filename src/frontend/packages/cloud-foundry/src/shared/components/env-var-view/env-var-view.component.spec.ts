import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';

import { CodeBlockComponent } from '../../../../../core/src/shared/components/code-block/code-block.component';
import {
  CopyToClipboardComponent,
} from '../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { EnvVarViewComponent } from './env-var-view.component';

describe('EnvVarViewComponent', () => {
  let component: EnvVarViewComponent;
  let fixture: ComponentFixture<EnvVarViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        EnvVarViewComponent,
        CodeBlockComponent,
        CopyToClipboardComponent
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [
        { provide: TailwindDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: { key: '', value: '' } }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvVarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
