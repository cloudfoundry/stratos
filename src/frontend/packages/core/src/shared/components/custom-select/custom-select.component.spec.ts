import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, vi, onTestFinished } from 'vitest';

import { CustomOptionComponent, CustomSelectComponent } from './custom-select.component';

// Regression for the Add Route domain dropdown: options bound to OBJECT
// values ([value]="domain") crashed the select on first open — the
// display text fell back to the raw value. displayText must always be a
// string.
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
// so displayText fell through to the object itself.
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

// None and four names: five options, short enough for a select-only
// combobox.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Org" [autoSelectSingleOption]="false" (valueChange)="picked.set($event)">
      <app-option [value]="null">None</app-option>
      @for (name of names; track name) {
        <app-option [value]="name" [disabled]="name === 'delta'">{{ name }}</app-option>
      }
    </app-select>
  `,
})
class OrgHostComponent {
  names = ['alpha', 'bravo', 'charlie', 'delta'];
  picked = signal<string | null | undefined>(undefined);
}

@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Space" (valueChange)="picked.set($event)">
      <app-option value="only">only</app-option>
    </app-select>
  `,
})
class SingleOptionHostComponent {
  picked = signal<string | undefined>(undefined);
}

// Seven options: more than five, so the select takes a filter.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Org" [required]="true" (valueChange)="picked.set($event)">
      @for (name of names(); track name) {
        <app-option [value]="name">{{ name }}</app-option>
      }
    </app-select>
  `,
})
class SearchableHostComponent {
  names = signal(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf']);
  picked = signal<string | null | undefined>(undefined);
}

const key = (target: EventTarget, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

function selectOf(fixture: ComponentFixture<unknown>): CustomSelectComponent {
  return fixture.debugElement.children[0].componentInstance as CustomSelectComponent;
}

function triggerOf(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[role="combobox"]');
}

function optionTexts(fixture: ComponentFixture<unknown>): string[] {
  return [...fixture.nativeElement.querySelectorAll('[role="option"]')]
    .map((el: Element) => el.textContent?.trim() ?? '');
}

// The active option is exposed a moment after the list opens (VoiceOver).
async function activeShown(fixture: ComponentFixture<unknown>) {
  const trigger = triggerOf(fixture);
  for (let i = 0; i < 50 && !trigger.hasAttribute('aria-activedescendant'); i++) {
    await new Promise(r => setTimeout(r, 20));
    await fixture.whenStable();
  }
}

function activeText(fixture: ComponentFixture<unknown>): string | undefined {
  const id = triggerOf(fixture).getAttribute('aria-activedescendant');
  return id ? fixture.nativeElement.querySelector(`[id="${id}"]`)?.textContent?.trim() : undefined;
}

async function type(fixture: ComponentFixture<unknown>, input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
  await fixture.whenStable();
}

describe('CustomSelectComponent with object-valued options', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('displayText is always a string, even before content capture', async () => {
    const fixture = TestBed.createComponent(ObjectValueHostComponent);
    await fixture.whenStable();
    selectOf(fixture).options().forEach(opt => expect(typeof opt.displayText()).toBe('string'));
  });

  it('opens without throwing when options carry object values', async () => {
    const fixture = TestBed.createComponent(ObjectValueHostComponent);
    await fixture.whenStable();
    triggerOf(fixture).click();
    await fixture.whenStable();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();
    expect(listbox.textContent).toContain('run.example.com');
  });

  it('opens without throwing even when option text is empty (displayText stays a string)', async () => {
    const fixture = TestBed.createComponent(EmptyTextObjectValueHostComponent);
    await fixture.whenStable();
    selectOf(fixture).options().forEach(opt => expect(typeof opt.displayText()).toBe('string'));
    triggerOf(fixture).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]').length).toBe(2);
  });

  // A select destroyed before any change detection must clean up quietly.
  it('can be destroyed before its first update', () => {
    const fixture = TestBed.createComponent(OrgHostComponent);
    expect(() => fixture.destroy()).not.toThrow();
  });
});

// WCAG 2.1.1: the options could not be reached or chosen by keyboard
// (Create App CF, Org and Space; Create Service, Select Service).
describe('CustomSelectComponent as a select-only combobox', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  async function open() {
    const fixture = TestBed.createComponent(OrgHostComponent);
    await fixture.whenStable();
    const trigger = triggerOf(fixture);
    trigger.focus();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    await activeShown(fixture);
    return { fixture, trigger };
  }

  it('is not a text field', async () => {
    const fixture = TestBed.createComponent(OrgHostComponent);
    await fixture.whenStable();
    expect(triggerOf(fixture).tagName).not.toBe('INPUT');
    expect(triggerOf(fixture).getAttribute('tabindex')).toBe('0');
  });

  it('names the combobox and the listbox from the placeholder', async () => {
    const { fixture, trigger } = await open();
    expect(trigger.getAttribute('aria-label')).toBe('Org');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(listbox.getAttribute('aria-label')).toBe('Org');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
  });

  // Chrome puts a scrollable box in the Tab order. Tab from an open long
  // list then focused the popup, which closed and dropped focus to <body>.
  it('keeps the scrolling popup out of the Tab order', async () => {
    const { fixture } = await open();
    const popup = fixture.nativeElement.querySelector('.select-options');
    expect(popup.getAttribute('tabindex')).toBe('-1');
  });

  it('opens with ArrowDown and renders real options', async () => {
    const { fixture, trigger } = await open();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(optionTexts(fixture)).toEqual(['None', 'alpha', 'bravo', 'charlie', 'delta']);
    const options = [...fixture.nativeElement.querySelectorAll('[role="option"]')] as HTMLElement[];
    options.forEach(o => {
      expect(o.id).toBeTruthy();
      expect(o.getAttribute('aria-selected')).toBe('false');
    });
    expect(options[4].getAttribute('aria-disabled')).toBe('true');
  });

  it('opens with Enter and with Space', async () => {
    for (const k of ['Enter', ' ']) {
      const fixture = TestBed.createComponent(OrgHostComponent);
      await fixture.whenStable();
      const trigger = triggerOf(fixture);
      trigger.focus();
      key(trigger, k);
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    }
  });

  it('moves the active option with the arrow keys and keeps focus on the trigger', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('bravo');
    key(trigger, 'ArrowUp');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('alpha');
    expect(document.activeElement).toBe(trigger);
  });

  it('selects the active option with Enter, closes, and reports the value', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('alpha');
    key(trigger, 'Enter');
    await fixture.whenStable();

    expect(fixture.componentInstance.picked()).toBe('alpha');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('alpha');
    expect(document.activeElement).toBe(trigger);
  });

  it('selects the active option with Space', async () => {
    const { fixture, trigger } = await open();
    // Arrows, not a letter: a Space right after typing is part of the
    // typed text (APG typeahead).
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, ' ');
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBe('bravo');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('jumps to an option by typing its first letter', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'c');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('charlie');
  });

  // APG: a disabled option stays reachable, so a screen reader user hears
  // it is there, but it cannot be chosen.
  it('reaches the disabled option but does not select it', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'c');
    await fixture.whenStable();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('delta');

    key(trigger, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBeUndefined();
  });

  it('clears the value when the None option is chosen', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBe('alpha');

    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, 'Home');
    await fixture.whenStable();
    key(trigger, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBeNull();
    expect(selectOf(fixture).selectedValue).toBeUndefined();
  });

  // WebKit reads the combobox's text as its value, so the placeholder and
  // the required star must not be text.
  it('draws the placeholder as CSS, not as text', async () => {
    const fixture = TestBed.createComponent(OrgHostComponent);
    await fixture.whenStable();
    const value = triggerOf(fixture).querySelector('[data-placeholder]') as HTMLElement;
    expect(value.dataset['placeholder']).toBe('Org');
    expect(value.textContent?.trim()).toBe('');
  });

  // The listbox toggles a single selection off; the select keeps it.
  it('keeps the chosen option when Enter lands on it again', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBe('alpha');

    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    await activeShown(fixture);
    expect(activeText(fixture)).toBe('alpha');
    key(trigger, 'Enter');
    await fixture.whenStable();
    expect(selectOf(fixture).selectedValue).toBe('alpha');
    expect(trigger.textContent).toContain('alpha');
  });

  it('stays on the last option when Down is pressed there', async () => {
    const { fixture, trigger } = await open();
    key(trigger, 'End');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('delta');
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('delta');
  });

  // Create App: Organization turns disabled while its orgs load. A list
  // left open then took no keys, Escape included.
  it('closes the list when the select turns disabled', async () => {
    const fixture = TestBed.createComponent(DisabledHostComponent);
    fixture.componentInstance.disabled.set(false);
    await fixture.whenStable();
    const trigger = triggerOf(fixture);
    trigger.focus();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  // [appFocus] focuses the host, which could not take focus.
  it('forwards focus from the host to the trigger', async () => {
    const fixture = TestBed.createComponent(OrgHostComponent);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('app-select') as HTMLElement).focus();
    expect(document.activeElement).toBe(triggerOf(fixture));
  });

  it('auto-selects a single option', async () => {
    const fixture = TestBed.createComponent(SingleOptionHostComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBe('only');
    expect(triggerOf(fixture).textContent).toContain('only');
  });
});

// More than five options: the trigger is a text field that filters the
// list (APG editable combobox with list autocomplete).
describe('CustomSelectComponent with a filter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(SearchableHostComponent);
    await fixture.whenStable();
    const input = triggerOf(fixture) as HTMLInputElement;
    input.focus();
    return { fixture, input };
  }

  it('makes the combobox a named text field that controls the list', async () => {
    const { fixture, input } = await render();
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('aria-label')).toBe('Org');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.placeholder).toBe('Org');
    // No second text field inside the list.
    key(input, 'ArrowDown');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(1);
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
  });

  it('opens the whole list with ArrowDown', async () => {
    const { fixture, input } = await render();
    key(input, 'ArrowDown');
    await fixture.whenStable();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(optionTexts(fixture).length).toBe(7);
  });

  it('opens on a click', async () => {
    const { fixture, input } = await render();
    input.click();
    await fixture.whenStable();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('filters as the user types, and focus stays in the field', async () => {
    const { fixture, input } = await render();
    await type(fixture, input, 'HA');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(optionTexts(fixture)).toEqual(['alpha', 'charlie']);
    expect(document.activeElement).toBe(input);
  });

  it('selects the active filtered option with Enter and shows it', async () => {
    const { fixture, input } = await render();
    await type(fixture, input, 'ha');
    key(input, 'ArrowDown');
    await fixture.whenStable();
    await activeShown(fixture);
    key(input, 'ArrowDown');
    await fixture.whenStable();
    expect(activeText(fixture)).toBe('charlie');
    key(input, 'Enter');
    await fixture.whenStable();

    expect(fixture.componentInstance.picked()).toBe('charlie');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.value).toBe('charlie');
    expect(document.activeElement).toBe(input);
    // The next open shows the whole list.
    key(input, 'ArrowDown');
    await fixture.whenStable();
    expect(optionTexts(fixture).length).toBe(7);
  });

  it('selects a filtered option with a click', async () => {
    const { fixture, input } = await render();
    await type(fixture, input, 'g');
    const golf = [...fixture.nativeElement.querySelectorAll('[role="option"]')]
      .find((o: Element) => o.textContent?.trim() === 'golf') as HTMLElement;
    golf.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBe('golf');
    expect(input.value).toBe('golf');
  });

  // The listbox drops a value whose option is not rendered; the select
  // must not lose its choice when the filter hides it.
  it('keeps the choice when typing hides it and the list closes with no pick', async () => {
    const { fixture, input } = await render();
    await type(fixture, input, 'echo');
    key(input, 'ArrowDown');
    await fixture.whenStable();
    key(input, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.picked()).toBe('echo');

    await type(fixture, input, 'gol');
    expect(optionTexts(fixture)).toEqual(['golf']);
    key(input, 'Escape');
    await fixture.whenStable();

    expect(selectOf(fixture).selectedValue).toBe('echo');
    expect(fixture.componentInstance.picked()).toBe('echo');
    expect(input.value).toBe('echo');
  });

  it('shows "No match" text that is not an option when nothing matches', async () => {
    const { fixture, input } = await render();
    await type(fixture, input, 'zulu');
    expect(optionTexts(fixture)).toEqual([]);
    expect(fixture.nativeElement.querySelector('.select-options')?.textContent).toContain('No match');
  });

  // Create App: the orgs load after the select renders. The field must
  // keep focus when the list grows past five and the trigger changes.
  it('keeps focus when options arrive and the trigger becomes a text field', async () => {
    const fixture = TestBed.createComponent(SearchableHostComponent);
    fixture.componentInstance.names.set(['alpha', 'bravo']);
    await fixture.whenStable();
    triggerOf(fixture).focus();
    expect(triggerOf(fixture).tagName).not.toBe('INPUT');

    fixture.componentInstance.names.set(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf']);
    await fixture.whenStable();

    expect(triggerOf(fixture).tagName).toBe('INPUT');
    expect(document.activeElement).toBe(triggerOf(fixture));
  });
});

describe('CustomSelectComponent and the Escape key', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  // Dialogs and the side panel close on any Escape that reaches the
  // document, so each case also records whether the key got that far.
  async function open<T>(host: new (...args: any[]) => T) {
    const fixture = TestBed.createComponent(host);
    await fixture.whenStable();
    const trigger = triggerOf(fixture);
    trigger.focus();
    trigger.click();
    await fixture.whenStable();
    const reachedDocument = vi.fn();
    document.addEventListener('keydown', reachedDocument);
    onTestFinished(() => document.removeEventListener('keydown', reachedDocument));
    return { fixture, trigger, reachedDocument };
  }

  it('closes the open list and keeps the key from the document', async () => {
    const { fixture, trigger, reachedDocument } = await open(OrgHostComponent);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    key(trigger, 'Escape');
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect(fixture.componentInstance.picked()).toBeUndefined();
    expect(reachedDocument).not.toHaveBeenCalled();
    // A closed list must not leave the combobox pointing at a hidden option.
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('closes the list from the filter field, clears the filter, and keeps the key', async () => {
    const { fixture, trigger, reachedDocument } = await open(SearchableHostComponent);
    await type(fixture, trigger as HTMLInputElement, 'fox');
    expect(optionTexts(fixture)).toEqual(['foxtrot']);

    key(trigger, 'Escape');
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect((trigger as HTMLInputElement).value).toBe('');
    expect(reachedDocument).not.toHaveBeenCalled();
    // Reopening shows the full list again.
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    expect(optionTexts(fixture).length).toBe(7);
  });

  it('lets Escape through when the list is closed', async () => {
    const { fixture, trigger, reachedDocument } = await open(OrgHostComponent);
    key(trigger, 'Escape');
    await fixture.whenStable();
    reachedDocument.mockClear();

    key(trigger, 'Escape');
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

// The deploy page's Organization select, inactive until a Cloud Foundry is
// chosen.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Organization" [disabled]="disabled()" [invalid]="true" errorMessage="Pick one" id="org">
      <app-option value="a">Org A</app-option>
    </app-select>
  `,
})
class DisabledHostComponent {
  disabled = signal(true);
}

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
    trigger.click();
    await fixture.whenStable();
    const listbox = el.querySelector('[role="listbox"]') as HTMLElement;
    return { fixture, el, trigger, listbox };
  }

  it('names the combobox and points it at its open list', async () => {
    const { trigger, listbox } = await render();
    expect(trigger.getAttribute('aria-label')).toBe('Auth Type');
    expect(listbox.id).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
  });

  it('gives each item the option role and its selected and disabled states', async () => {
    const { fixture, trigger, listbox } = await render();
    const options = () => Array.from(listbox.querySelectorAll('[role="option"]'));
    expect(options().map(o => o.textContent?.trim())).toEqual(['Username and Password', 'Single Sign-On (SSO)', 'No Authentication']);
    expect(options().map(o => o.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(options().map(o => o.getAttribute('aria-disabled'))).toEqual(['false', 'false', 'true']);

    // Picking another option moves the selected state with it.
    (options()[1] as HTMLElement).click();
    await fixture.whenStable();
    trigger.click();
    await fixture.whenStable();
    expect(options().map(o => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
  });

  // The inactive select only looked disabled (faded, no pointer events);
  // assistive tech was not told (WCAG 4.1.2).
  it('tells assistive tech when it is disabled', async () => {
    const fixture = TestBed.createComponent(DisabledHostComponent);
    await fixture.whenStable();
    const trigger = () => (fixture.nativeElement as HTMLElement).querySelector('[role="combobox"]') as HTMLElement;
    expect(trigger().getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.disabled.set(false);
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-disabled')).not.toBe('true');
  });

  // The invalid state and its message belong on the combobox, the element
  // that has focus, not on a wrapper with no role.
  it('marks the combobox invalid and points it at the message', async () => {
    const fixture = TestBed.createComponent(DisabledHostComponent);
    await fixture.whenStable();
    const trigger = triggerOf(fixture);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('error-org');
  });

  it('keeps list ids apart when selects have no id or name', async () => {
    const a = await render();
    const b = await render();
    expect(a.listbox.id).not.toBe(b.listbox.id);
  });
});

// The select takes its value from a bound [value] or from a form control.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent, ReactiveFormsModule],
  template: `
    <app-select data-test="bound" [value]="bound()">
      <app-option value="a">A</app-option>
      <app-option value="b">B</app-option>
    </app-select>
    <app-select data-test="form" [formControl]="control">
      <app-option value="a">A</app-option>
      <app-option value="b">B</app-option>
    </app-select>
  `,
})
class ValueSourceHostComponent {
  bound = signal<string | undefined>('a');
  control = new FormControl('b');
}

describe('CustomSelectComponent value sources', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ValueSourceHostComponent);
    await fixture.whenStable();
    const shown = (name: string) => (fixture.nativeElement as HTMLElement)
      .querySelector(`[data-test="${name}"] :is(.select-trigger-value, .select-trigger-placeholder)`)?.textContent?.trim();
    return { fixture, shown };
  }

  it('follows a bound value, also when it changes or is cleared later', async () => {
    const { fixture, shown } = await render();
    expect(shown('bound')).toBe('A');

    fixture.componentInstance.bound.set('b');
    await fixture.whenStable();
    expect(shown('bound')).toBe('B');

    fixture.componentInstance.bound.set(undefined);
    await fixture.whenStable();
    expect(shown('bound')).toBe('');
  });

  // With no [value] bound the input is undefined, which is not a value to show.
  it('keeps the value a form control wrote when no value is bound', async () => {
    const { shown } = await render();
    expect(shown('form')).toBe('B');
  });

  it('reports a keyboard pick to the form control', async () => {
    const { fixture } = await render();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('[data-test="form"] [role="combobox"]') as HTMLElement;
    trigger.focus();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    key(trigger, 'Home');
    await fixture.whenStable();
    key(trigger, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('a');
  });
});

// The trigger shows the text of the selected option, which an option only
// knows once its projected content has rendered.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent],
  template: `
    <app-select placeholder="Pick one" [value]="'b'">
      <app-option value="a">Alpha</app-option>
      <app-option value="b">Bravo</app-option>
    </app-select>
  `,
})
class TriggerTextHostComponent {}

describe('CustomSelectComponent trigger text', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(TriggerTextHostComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const shown = () => el.querySelector('.select-trigger-value, .select-trigger-placeholder')?.textContent?.trim();
    return { fixture, el, shown };
  }

  it('shows the projected text of the selected option', async () => {
    const { shown } = await render();
    expect(shown()).toBe('Bravo');
  });

  it('follows a pick made from the list', async () => {
    const { fixture, el, shown } = await render();
    el.querySelector<HTMLElement>('[role="combobox"]')!.click();
    await fixture.whenStable();
    el.querySelectorAll<HTMLElement>('.custom-option-content')[0].click();
    await fixture.whenStable();

    expect(shown()).toBe('Alpha');
    expect(el.querySelector('[role="combobox"]')!.getAttribute('aria-expanded')).toBe('false');
  });
});

// No template uses a multiple select yet. Seven options: a multiple select
// takes no filter, however long its list.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent, ReactiveFormsModule],
  template: `
    <app-select placeholder="Plans" multiple [formControl]="control">
      @for (name of names; track name) {
        <app-option [value]="name">{{ name }}</app-option>
      }
    </app-select>
  `,
})
class MultipleHostComponent {
  names = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf'];
  control = new FormControl<string[]>([]);
}

// A multiple select whose form has a default to reset to.
@Component({
  standalone: true,
  imports: [CustomSelectComponent, CustomOptionComponent, ReactiveFormsModule],
  template: `
    <app-select placeholder="Plans" multiple [formControl]="control">
      @for (name of names; track name) {
        <app-option [value]="name">{{ name }}</app-option>
      }
    </app-select>
  `,
})
class MultipleDefaultHostComponent {
  names = ['alpha', 'bravo', 'charlie'];
  control = new FormControl(['alpha'], { nonNullable: true });
}

describe('CustomSelectComponent with multiple', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  async function open() {
    const fixture = TestBed.createComponent(MultipleHostComponent);
    await fixture.whenStable();
    const trigger = triggerOf(fixture);
    trigger.focus();
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    await activeShown(fixture);
    const press = async (k: string) => {
      key(trigger, k);
      await fixture.whenStable();
    };
    const shown = () => trigger.querySelector('.select-trigger-value, .select-trigger-placeholder')?.textContent?.trim();
    return { fixture, trigger, press, shown };
  }

  it('is a select-only combobox over a multi-select list', async () => {
    const { fixture, trigger } = await open();
    expect(trigger.tagName).not.toBe('INPUT');
    expect(fixture.nativeElement.querySelector('[role="listbox"]').getAttribute('aria-multiselectable')).toBe('true');
    expect(optionTexts(fixture).length).toBe(7);
  });

  it('toggles the active option with Enter and Space and keeps the list open', async () => {
    const { fixture, trigger, press } = await open();
    // The list opens on the first option.
    expect(activeText(fixture)).toBe('alpha');
    await press('Enter');
    expect(fixture.componentInstance.control.value).toEqual(['alpha']);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await press('ArrowDown');
    await press(' ');
    expect(fixture.componentInstance.control.value).toEqual(['alpha', 'bravo']);

    await press('Enter');
    expect(fixture.componentInstance.control.value).toEqual(['alpha']);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(trigger);
  });

  it('marks each chosen option selected', async () => {
    const { fixture, press } = await open();
    await press('Enter');
    await press('End');
    await press('Enter');
    const selected = [...fixture.nativeElement.querySelectorAll('[role="option"][aria-selected="true"]')]
      .map((o: Element) => o.textContent?.trim());
    expect(selected).toEqual(['alpha', 'golf']);
  });

  it('shows one choice by its text and more as a count', async () => {
    const { press, shown } = await open();
    expect(shown()).toBe('');
    await press('Enter');
    expect(shown()).toBe('alpha');
    await press('ArrowDown');
    await press('Enter');
    expect(shown()).toBe('2 selected');
  });

  it('closes with Escape and keeps the choices', async () => {
    const { fixture, trigger, press } = await open();
    await press('Enter');
    await press('Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.control.value).toEqual(['alpha']);
    expect(document.activeElement).toBe(trigger);
  });

  it('shows the choices a form control writes', async () => {
    const fixture = TestBed.createComponent(MultipleHostComponent);
    fixture.componentInstance.control.setValue(['charlie', 'echo']);
    await fixture.whenStable();
    expect(triggerOf(fixture).querySelector('.select-trigger-value')?.textContent?.trim()).toBe('2 selected');
    expect(selectOf(fixture).selectedValue).toEqual(['charlie', 'echo']);
  });

  // A form value that arrives while the user is choosing must not undo
  // the choices; a reset still clears them.
  it('ignores a form write while the list is open, except a clear', async () => {
    const { fixture, press } = await open();
    await press('Enter');
    fixture.componentInstance.control.setValue(['golf']);
    await fixture.whenStable();
    expect(selectOf(fixture).selectedValue).toEqual(['alpha']);

    fixture.componentInstance.control.setValue([]);
    await fixture.whenStable();
    expect(selectOf(fixture).selectedValue).toEqual([]);
  });

  it('lets the user remove every choice', async () => {
    const { fixture, trigger, press, shown } = await open();
    await press('Enter');
    await press('Enter');
    expect(fixture.componentInstance.control.value).toEqual([]);
    await press('Escape');
    expect(shown()).toBe('');
    expect(trigger.querySelector('[data-placeholder]')?.getAttribute('data-placeholder')).toBe('Plans');
  });

  it('goes back to the default on a form reset', async () => {
    const fixture = TestBed.createComponent(MultipleDefaultHostComponent);
    await fixture.whenStable();
    const trigger = triggerOf(fixture);
    trigger.focus();
    for (const k of ['ArrowDown', 'End', 'Enter', 'Escape']) {
      key(trigger, k);
      await fixture.whenStable();
      if (k === 'ArrowDown') await activeShown(fixture);
    }
    expect(fixture.componentInstance.control.value).toEqual(['alpha', 'charlie']);

    fixture.componentInstance.control.reset();
    await fixture.whenStable();
    expect(selectOf(fixture).selectedValue).toEqual(['alpha']);
    expect(trigger.querySelector('.select-trigger-value')?.textContent?.trim()).toBe('alpha');
    key(trigger, 'ArrowDown');
    await fixture.whenStable();
    const selected = [...fixture.nativeElement.querySelectorAll('[role="option"][aria-selected="true"]')]
      .map((o: Element) => o.textContent?.trim());
    expect(selected).toEqual(['alpha']);
  });
});
