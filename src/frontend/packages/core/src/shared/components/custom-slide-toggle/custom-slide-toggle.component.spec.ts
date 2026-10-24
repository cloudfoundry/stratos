import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { CustomSlideToggleComponent } from './custom-slide-toggle.component';

// The form sets the value and the disabled state from code (writeValue,
// setDisabledState), not through a template binding, so the toggle has to
// repaint itself under OnPush and zoneless change detection.
@Component({
  standalone: true,
  imports: [CustomSlideToggleComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-slide-toggle [formControl]="control">Use it</app-slide-toggle>`,
})
class HostComponent {
  control = new FormControl({ value: false, disabled: true }, { nonNullable: true });
}

describe('CustomSlideToggleComponent as a form control', () => {
  async function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const toggle = () => fixture.nativeElement.querySelector('.custom-slide-toggle') as HTMLElement;
    return { fixture, toggle, control: fixture.componentInstance.control };
  }

  it('shows enabled once the form enables it, and disabled again', async () => {
    const { fixture, toggle, control } = await setup();
    expect(toggle().classList).toContain('disabled');

    control.enable();
    await fixture.whenStable();
    expect(toggle().classList).not.toContain('disabled');

    control.disable();
    await fixture.whenStable();
    expect(toggle().classList).toContain('disabled');
  });

  it('shows a value the form sets', async () => {
    const { fixture, toggle, control } = await setup();
    control.enable();
    control.setValue(true);
    await fixture.whenStable();
    expect(toggle().classList).toContain('checked');

    control.setValue(false);
    await fixture.whenStable();
    expect(toggle().classList).not.toContain('checked');
  });
});
