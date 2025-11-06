import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RequestInfoState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { DialogConfirmComponent } from './dialog-confirm.component';

describe('DialogConfirmComponent', () => {
  let component: DialogConfirmComponent;
  let fixture: ComponentFixture<DialogConfirmComponent>;
  let element: HTMLElement;

  class TailwindDialogRefMock {
    close() {
    }
  }

  class DialogDataMock {
    confirm = 'Confirm';
    message = { textToMatch: 'textToMatch' };
    title = 'Title';
    row = {
      entity: {
        metadata: {}
      },
      entityRequestInfo: {} as RequestInfoState
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DialogConfirmComponent,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: TailwindDialogRef, useClass: TailwindDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: DialogDataMock },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close when clicked on cancel', () => {
    const spy = vi.spyOn(component.dialogRef, 'close');
    element.querySelector('button').click();

    expect(spy).toHaveBeenCalled();
  });

  it('should enable confirm button if matches text', () => {
    const confirm: HTMLButtonElement = element.querySelector('.confirm-dialog__confirm');
    const input: HTMLInputElement = element.querySelector('input');
    expect(confirm.disabled).toBeTruthy();

    input.value = 'textToMatch';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(confirm.disabled).toBeFalsy();
  });

  it('should not show warning icon if critical', () => {
    component.data = {
      ...component.data,
      message: {
        textToMatch: '',
      },
      critical: true,
    };
    fixture.detectChanges();

    expect(element.querySelector('mat-icon').textContent).toEqual('warning');
  });

  it('should show warning icon if text to match', () => {
    component.data = {
      ...component.data,
      message: {
        textToMatch: 'text',
      },
      critical: false,
    };
    fixture.detectChanges();

    expect(element.querySelector('mat-icon').textContent).toEqual('warning');
  });

  it('should show warning icon if is critical', () => {
    component.data = {
      ...component.data,
      message: {
        textToMatch: '',
      },
      critical: true,
    };
    fixture.detectChanges();

    expect(element.querySelector('mat-icon').textContent).toEqual('warning');

  });

  it('should disable confirm button if not matching text', () => {
    const confirm: HTMLButtonElement = element.querySelector('.confirm-dialog__confirm');
    expect(confirm.disabled).toBeTruthy();
  });
});
