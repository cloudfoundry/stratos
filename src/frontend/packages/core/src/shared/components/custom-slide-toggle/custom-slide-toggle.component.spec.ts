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

// The switch was a div with role, tabindex and handlers wrapping the real
// checkbox: two interactive elements for one control (axe
// nested-interactive, WCAG 4.1.2). The input is now the switch.
describe('CustomSlideToggleComponent as a switch', () => {
  async function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.control.enable();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = () => root.querySelector('input') as HTMLInputElement;
    return { fixture, root, input, control: fixture.componentInstance.control };
  }

  it('is one switch, the checkbox itself, named by its label', async () => {
    const { root, input } = await setup();
    expect(root.querySelectorAll('[role="switch"]').length).toBe(1);
    expect(input().getAttribute('role')).toBe('switch');
    expect(root.querySelectorAll('[tabindex]').length).toBe(0);
    expect(input().labels?.[0]?.textContent).toContain('Use it');
  });

  it('toggles once per click and on Enter', async () => {
    const { fixture, input, control } = await setup();
    input().click();
    await fixture.whenStable();
    expect(control.value).toBe(true);
    expect(input().checked).toBe(true);

    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(control.value).toBe(false);
    expect(input().checked).toBe(false);
  });
});
