import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { CustomCheckboxComponent } from './custom-checkbox.component';

// The form sets the value and the disabled state from code (writeValue,
// setDisabledState), not through a template binding, so the checkbox has
// to repaint itself under OnPush and zoneless change detection.
@Component({
  standalone: true,
  imports: [CustomCheckboxComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-checkbox [formControl]="control">Use it</app-checkbox>`,
})
class HostComponent {
  control = new FormControl({ value: false, disabled: true }, { nonNullable: true });
}

describe('CustomCheckboxComponent as a form control', () => {
  async function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const box = () => fixture.nativeElement.querySelector('.custom-checkbox') as HTMLElement;
    return { fixture, box, control: fixture.componentInstance.control };
  }

  it('shows enabled once the form enables it, and disabled again', async () => {
    const { fixture, box, control } = await setup();
    expect(box().classList).toContain('disabled');

    control.enable();
    await fixture.whenStable();
    expect(box().classList).not.toContain('disabled');
    expect(box().getAttribute('tabindex')).toBe('0');

    control.disable();
    await fixture.whenStable();
    expect(box().classList).toContain('disabled');
  });

  it('shows a value the form sets', async () => {
    const { fixture, box, control } = await setup();
    control.enable();
    control.setValue(true);
    await fixture.whenStable();
    expect(box().getAttribute('aria-checked')).toBe('true');

    control.setValue(false);
    await fixture.whenStable();
    expect(box().getAttribute('aria-checked')).toBe('false');
  });
});
