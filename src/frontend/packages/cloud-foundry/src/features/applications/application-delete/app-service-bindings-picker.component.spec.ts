import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { AppServiceBindingsPickerComponent } from './app-service-bindings-picker.component';
import type { StServiceBinding } from '../../../services/endpoint-data/stratos-types';

@Component({
  standalone: true,
  imports: [AppServiceBindingsPickerComponent],
  template: `<app-service-bindings-picker [bindings]="bindings()" (selectedChange)="onSelected($event)" />`,
})
class Host {
  bindings = signal<StServiceBinding[]>([]);
  lastSelected: StServiceBinding[] = [];
  onSelected(s: StServiceBinding[]) {
    this.lastSelected = s;
  }
}

const managed: StServiceBinding = {
  guid: 'b-managed',
  name: 'db-binding',
  bindingType: 'app',
  appGuid: 'app-1',
  serviceInstanceGuid: 'si-1',
  serviceInstanceName: 'primary-db',
  serviceInstanceType: 'managed',
  createdAt: '',
  updatedAt: '',
};

const userProvided: StServiceBinding = {
  guid: 'b-ups',
  name: 'cache-binding',
  bindingType: 'app',
  appGuid: 'app-1',
  serviceInstanceGuid: 'si-2',
  serviceInstanceName: 'user-cache',
  serviceInstanceType: 'user-provided',
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

  it('shows a type badge when serviceInstanceType is populated', () => {
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
