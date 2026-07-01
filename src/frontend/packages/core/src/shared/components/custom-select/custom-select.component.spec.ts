import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CustomOptionComponent, CustomSelectComponent } from './custom-select.component';

// Regression for the Add Route domain dropdown: options bound to OBJECT
// values ([value]="domain") crashed the select on first open — the
// displayText getter fell back to the raw value before the projected
// content was captured, and applyOptionFilter called .toLowerCase() on
// the object. displayText must always return a string.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Domain">
      @for (item of items; track item.entity.name) {
        <app-option [value]="item">{{ item.entity.name }}</app-option>
      }
    </app-select>
  `,
})
class ObjectValueHostComponent {
  items = [
    { entity: { name: 'run.example.com' } },
    { entity: { name: 'apps.internal' } },
  ];
}

// The crash shape from #5523's Add Route dropdown: the projected option
// text resolved to '' (stale `domain?.entity?.name` against a flat DTO),
// so displayText fell through '' || value and returned the object itself.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Domain">
      @for (item of items; track item.name) {
        <app-option [value]="item">{{ item.missing?.name }}</app-option>
      }
    </app-select>
  `,
})
class EmptyTextObjectValueHostComponent {
  items: { name: string; missing?: { name: string } }[] = [
    { name: 'run.example.com' },
    { name: 'apps.internal' },
  ];
}

describe('CustomSelectComponent with object-valued options', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('displayText is always a string, even before content capture', () => {
    const fixture = TestBed.createComponent(ObjectValueHostComponent);
    fixture.detectChanges();
    const options = fixture.debugElement.children[0].componentInstance.options as { displayText: unknown }[] | undefined;
    // Access via the select's ContentChildren once rendered.
    const select = fixture.debugElement.children[0].componentInstance as CustomSelectComponent;
    (select as any).options.forEach((opt: CustomOptionComponent) => {
      expect(typeof opt.displayText).toBe('string');
    });
    void options;
  });

  it('opens without throwing when options carry object values', () => {
    const fixture = TestBed.createComponent(ObjectValueHostComponent);
    fixture.detectChanges();
    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="combobox"]');
    expect(() => {
      trigger.click();
      fixture.detectChanges();
    }).not.toThrow();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();
    expect(listbox.textContent).toContain('run.example.com');
  });

  it('opens without throwing even when option text is empty (displayText stays a string)', () => {
    const fixture = TestBed.createComponent(EmptyTextObjectValueHostComponent);
    fixture.detectChanges();
    const select = fixture.debugElement.children[0].componentInstance as CustomSelectComponent;
    (select as any).options.forEach((opt: CustomOptionComponent) => {
      expect(typeof opt.displayText).toBe('string');
    });
    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="combobox"]');
    expect(() => {
      trigger.click();
      fixture.detectChanges();
    }).not.toThrow();
  });
});
