import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CustomButtonToggleComponent, CustomButtonToggleGroupComponent } from './custom-button-toggle.component';

// The group sets each toggle's checked state from code, so every toggle,
// not only the one clicked, has to repaint under OnPush and zoneless
// change detection.
@Component({
  standalone: true,
  imports: [CustomButtonToggleGroupComponent, CustomButtonToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-button-toggle-group [value]="mode()" (change)="mode.set($event.value)" name="theme">
      <app-button-toggle value="light">Light</app-button-toggle>
      <app-button-toggle value="dark">Dark</app-button-toggle>
      <app-button-toggle value="system">System</app-button-toggle>
    </app-button-toggle-group>`,
})
class HostComponent {
  mode = signal('light');
}

describe('CustomButtonToggleGroupComponent', () => {
  async function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('.custom-button-toggle')) as HTMLButtonElement[];
    const selected = () => buttons().filter(b => b.classList.contains('selected')).map(b => b.textContent?.trim());
    return { fixture, buttons, selected };
  }

  it('moves the selection to the toggle clicked', async () => {
    const { fixture, buttons, selected } = await setup();
    expect(selected()).toEqual(['Light']);

    buttons()[1].click();
    await fixture.whenStable();
    expect(selected()).toEqual(['Dark']);
  });

  it('shows a value set from outside', async () => {
    const { fixture, selected } = await setup();
    fixture.componentInstance.mode.set('system');
    await fixture.whenStable();
    expect(selected()).toEqual(['System']);
  });
});
