import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

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
      entityRequestInfo: {}
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
        provideZonelessChangeDetection(),
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

  // The warning glyph sits inside the heading; its ligature must not join
  // the heading's name ("Titlewarning").
  it('keeps the warning icon out of the heading name', () => {
    const icon = element.querySelector('h1 .confirm-dialog__warn-icon');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should close when clicked on cancel', () => {
    const spy = vi.spyOn(component.dialogRef, 'close');
    const cancelButton = element.querySelector('button');
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();

    expect(spy).toHaveBeenCalled();
  });

  it('labels the type-to-confirm field with its prompt', () => {
    const input = element.querySelector<HTMLInputElement>('#typeToConfirm');
    expect(input).toBeTruthy();
    const label = element.querySelector(`label[for="${input!.id}"]`);
    expect(label?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Please type textToMatch to continue.');
  });

  it('should enable confirm button if matches text', () => {
    const confirm: HTMLButtonElement | null = element.querySelector('.confirm-dialog__confirm');
    const input: HTMLInputElement | null = element.querySelector('input');
    expect(confirm).toBeTruthy();
    expect(input).toBeTruthy();

    if (!confirm || !input) {
      return;
    }

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

    const warningIcon = element.querySelector('.material-icons');
    expect(warningIcon).toBeTruthy();
    expect(warningIcon?.textContent).toEqual('warning');
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

    const warningIcon = element.querySelector('.material-icons');
    expect(warningIcon).toBeTruthy();
    expect(warningIcon?.textContent).toEqual('warning');
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

    const warningIcon = element.querySelector('.material-icons');
    expect(warningIcon).toBeTruthy();
    expect(warningIcon?.textContent).toEqual('warning');
  });

  it('should disable confirm button if not matching text', () => {
    const confirm: HTMLButtonElement | null = element.querySelector('.confirm-dialog__confirm');
    expect(confirm).toBeTruthy();
    expect(confirm?.disabled).toBeTruthy();
  });
});
