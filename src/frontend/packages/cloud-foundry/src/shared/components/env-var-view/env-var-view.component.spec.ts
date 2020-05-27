import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CodeBlockComponent } from '../../../../../core/src/shared/components/code-block/code-block.component';
import {
  CopyToClipboardComponent,
} from '../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { BaseTestModulesNoShared } from '../../../../../core/test-framework/core-test.helper';
import { EnvVarViewComponent } from './env-var-view.component';

describe('EnvVarViewComponent', () => {
  let component: EnvVarViewComponent;
  let fixture: ComponentFixture<EnvVarViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EnvVarViewComponent,
        CodeBlockComponent,
        CopyToClipboardComponent
      ],
      imports: [...BaseTestModulesNoShared],
      providers: [
        { provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: { key: '', value: '' } }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvVarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
