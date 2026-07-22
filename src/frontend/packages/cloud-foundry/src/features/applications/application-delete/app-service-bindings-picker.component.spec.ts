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
  it('renders an empty-state message when no bindings', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No service instances');
  });

  it('renders one checkbox row per binding with the service instance name', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('[data-test="binding-checkbox"]');
    expect(boxes.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('primary-db');
    expect(fixture.nativeElement.textContent).toContain('user-cache');
  });

  it('shows a type badge when serviceInstance.type is populated', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('[data-test="binding-type"]');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('managed');
    expect(badges[1].textContent).toContain('user-provided');
  });

  it('toggling a checkbox emits selectedChange', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('[data-test="binding-checkbox"]') as NodeListOf<HTMLInputElement>;
    boxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([managed]);
    boxes[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([managed, userProvided]);
  });

  it('select-all selects every binding; Clear empties the selection', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed, userProvided]);
    fixture.detectChanges();
    const selectAll = fixture.nativeElement.querySelector('[data-test="bindings-select-all"]') as HTMLButtonElement;
    const clearBtn = fixture.nativeElement.querySelector('[data-test="bindings-select-none"]') as HTMLButtonElement;
    selectAll.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([managed, userProvided]);
    clearBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([]);
  });

  it('hides select-all / Clear when only one binding is shown', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.bindings.set([managed]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="bindings-select-all"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="bindings-select-none"]')).toBeNull();
  });
});
