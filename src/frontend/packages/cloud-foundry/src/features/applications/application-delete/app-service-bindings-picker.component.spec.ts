import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { AppServiceBindingsPickerComponent } from './app-service-bindings-picker.component';
import type { StServiceCredentialBinding } from '../../../services/endpoint-data/stratos-types';

@Component({
  standalone: true,
  imports: [AppServiceBindingsPickerComponent],
  template: `<app-service-bindings-picker [bindings]="bindings()" (selectedChange)="onSelected($event)" />`,
})
class Host {
  bindings = signal<StServiceCredentialBinding[]>([]);
  lastSelected: StServiceCredentialBinding[] = [];
  onSelected(s: StServiceCredentialBinding[]) {
    this.lastSelected = s;
  }
}

const managed: StServiceCredentialBinding = {
  guid: 'b-managed',
  cnsiGuid: 'cnsi-1',
  name: 'db-binding',
  type: 'app',
  app: { guid: 'app-1' },
  serviceInstance: {
    guid: 'si-1',
    name: 'primary-db',
    type: 'managed',
  },
  createdAt: '',
  updatedAt: '',
};

const userProvided: StServiceCredentialBinding = {
  guid: 'b-ups',
  cnsiGuid: 'cnsi-1',
  name: 'cache-binding',
  type: 'app',
  app: { guid: 'app-1' },
  serviceInstance: {
    guid: 'si-2',
    name: 'user-cache',
    type: 'user-provided',
  },
  createdAt: '',
  updatedAt: '',
};

describe('AppServiceBindingsPickerComponent', () => {
  it('renders an empty-state message when no bindings', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No service instances');
  });

  it('renders one checkbox row per binding with the service instance name', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    await fixture.whenStable();
    const boxes = fixture.nativeElement.querySelectorAll('[data-test="binding-checkbox"]');
    expect(boxes.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('primary-db');
    expect(fixture.nativeElement.textContent).toContain('user-cache');
  });

  it('shows a type badge when serviceInstance.type is populated', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    await fixture.whenStable();
    const badges = fixture.nativeElement.querySelectorAll('[data-test="binding-type"]');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('managed');
    expect(badges[1].textContent).toContain('user-provided');
  });

  it('toggling a checkbox emits selectedChange', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    await fixture.whenStable();
    const boxes = fixture.nativeElement.querySelectorAll('[data-test="binding-checkbox"]') as NodeListOf<HTMLInputElement>;
    boxes[0].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.lastSelected).toEqual([managed]);
    boxes[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.lastSelected).toEqual([managed, userProvided]);
  });

  it('select-all selects every binding; Clear empties the selection', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    await fixture.whenStable();
    const selectAll = fixture.nativeElement.querySelector('[data-test="bindings-select-all"]') as HTMLButtonElement;
    const clearBtn = fixture.nativeElement.querySelector('[data-test="bindings-select-none"]') as HTMLButtonElement;
    selectAll.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.lastSelected).toEqual([managed, userProvided]);
    clearBtn.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.lastSelected).toEqual([]);
  });

  it('hides select-all / Clear when only one binding is shown', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-test="bindings-select-all"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="bindings-select-none"]')).toBeNull();
  });

  // WCAG 4.1.2: each checkbox is named by its service instance, through a
  // label that holds the box and the name (axe-core label).
  it('names each checkbox by its service instance', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    await fixture.whenStable();
    const boxes = [...fixture.nativeElement.querySelectorAll('[data-test="binding-checkbox"]')] as HTMLInputElement[];
    expect(boxes.map(b => b.closest('label')?.textContent?.trim())).toEqual(['primary-db', 'user-cache']);
  });
});
