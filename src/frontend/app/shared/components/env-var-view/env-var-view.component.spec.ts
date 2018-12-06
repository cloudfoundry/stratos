import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvVarViewComponent } from './env-var-view.component';
import { CodeBlockComponent } from '../code-block/code-block.component';
import { BaseTestModulesNoShared } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

describe('EnvVarViewComponent', () => {
  let component: EnvVarViewComponent;
  let fixture: ComponentFixture<EnvVarViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EnvVarViewComponent, CodeBlockComponent],
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
