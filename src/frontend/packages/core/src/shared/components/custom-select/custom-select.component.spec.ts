import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, onTestFinished } from 'vitest';

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

// Seven options: above the search threshold, so the filter input renders.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Org">
      @for (name of names; track name) {
        <app-option [value]="name">{{ name }}</app-option>
      }
    </app-select>
  `,
})
class SearchableHostComponent {
  names = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf'];
}

describe('CustomSelectComponent and the Escape key', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  // Dialogs and the side panel close on any Escape that reaches the
  // document, so each case also records whether the key got that far.
  function open() {
    const fixture = TestBed.createComponent(SearchableHostComponent);
    fixture.detectChanges();
    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="combobox"]');
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    const reachedDocument = vi.fn();
    document.addEventListener('keydown', reachedDocument);
    onTestFinished(() => document.removeEventListener('keydown', reachedDocument));
    return { fixture, trigger, reachedDocument };
  }
  const escape = (target: EventTarget) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  it('closes the open list from the trigger and keeps the key from the document', () => {
    const { fixture, trigger, reachedDocument } = open();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    escape(trigger);
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect(reachedDocument).not.toHaveBeenCalled();
  });

  it('closes the list from the filter input, clears the filter, and refocuses the trigger', () => {
    const { fixture, trigger, reachedDocument } = open();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-label="Filter options"]');
    input.focus();
    input.value = 'fox';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    escape(input);
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect(reachedDocument).not.toHaveBeenCalled();
    // Reopening shows the full list again.
    trigger.click();
    fixture.detectChanges();
    const shown = [...fixture.nativeElement.querySelectorAll('.custom-option-content')]
      .filter((el: HTMLElement) => el.style.display !== 'none');
    expect(shown.length).toBe(7);
  });

  it('lets Escape through when the list is closed', () => {
    const { fixture, trigger, reachedDocument } = open();
    escape(trigger);
    fixture.detectChanges();
    reachedDocument.mockClear();

    escape(trigger);
    expect(reachedDocument).toHaveBeenCalledTimes(1);
  });
});

// The trigger is a combobox, which takes no name from the value it shows.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select data-test="named" ariaLabel="Time window" placeholder="Pick one"><app-option value="a">A</app-option></app-select>
    <app-select data-test="placeholder" placeholder="Domain"><app-option value="a">A</app-option></app-select>
    <app-select data-test="bare"><app-option value="a">A</app-option></app-select>
  `,
})
class NamedSelectHostComponent {}

describe('CustomSelectComponent accessible name', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('names the combobox with ariaLabel, else the placeholder, else nothing', async () => {
    const fixture = TestBed.createComponent(NamedSelectHostComponent);
    await fixture.whenStable();
    const trigger = (name: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`[data-test="${name}"] [role="combobox"]`);
    expect(trigger('named')?.getAttribute('aria-label')).toBe('Time window');
    expect(trigger('placeholder')?.getAttribute('aria-label')).toBe('Domain');
    expect(trigger('bare')?.hasAttribute('aria-label')).toBe(false);
  });
});

// The Connect dialog's Auth Type select, as a screen reader meets it.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Auth Type" [value]="'creds'">
      <app-option value="creds">Username and Password</app-option>
      <app-option value="sso">Single Sign-On (SSO)</app-option>
      <app-option value="none" [disabled]="true">No Authentication</app-option>
    </app-select>
  `,
})
class AuthTypeHostComponent {}

describe('CustomSelectComponent roles and states', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(AuthTypeHostComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const trigger = el.querySelector('[role="combobox"]') as HTMLElement;
    const listbox = el.querySelector('[role="listbox"]') as HTMLElement;
    return { fixture, el, trigger, listbox };
  }

  it('names the combobox and points it at its list, open or closed', async () => {
    const { fixture, trigger, listbox } = await render();
    expect(trigger.getAttribute('aria-label')).toBe('Auth Type');
    expect(listbox.id).toBeTruthy();
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);

    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
  });

  it('gives each item the option role and its selected and disabled states', async () => {
    const { fixture, listbox } = await render();
    const options = () => Array.from(listbox.querySelectorAll('[role="option"]'));
    expect(options().map(o => o.textContent?.trim())).toEqual(['Username and Password', 'Single Sign-On (SSO)', 'No Authentication']);
    expect(options().map(o => o.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(options().map(o => o.getAttribute('aria-disabled'))).toEqual([null, null, 'true']);

    // Picking another option moves the selected state with it.
    (options()[1].querySelector('.custom-option-content') as HTMLElement).click();
    await fixture.whenStable();
    expect(options().map(o => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
  });

  it('keeps list ids apart when selects have no id or name', async () => {
    const a = await render();
    const b = await render();
    expect(a.listbox.id).not.toBe(b.listbox.id);
  });
});
