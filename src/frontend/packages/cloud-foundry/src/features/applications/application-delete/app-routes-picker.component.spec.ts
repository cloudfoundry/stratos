import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { AppRoutesPickerComponent } from './app-routes-picker.component';
import type { StRoute } from '../../../services/endpoint-data/stratos-types';

@Component({
  standalone: true,
  imports: [AppRoutesPickerComponent],
  template: `<app-routes-picker [routes]="routes()" (selectedChange)="onSelected($event)" />`,
})
class Host {
  routes = signal<StRoute[]>([]);
  lastSelected: StRoute[] = [];
  onSelected(s: StRoute[]) {
    this.lastSelected = s;
  }
}

const routeA: StRoute = {
  guid: 'r-a',
  url: 'app-a.example.com',
  host: 'app-a',
  path: '',
  domainGuid: 'd-1',
  spaceGuid: 's-1',
  cnsiGuid: 'cnsi-1',
  createdAt: '',
  updatedAt: '',
};

const routeB: StRoute = {
  guid: 'r-b',
  url: 'app-b.example.com/api',
  host: 'app-b',
  path: '/api',
  domainGuid: 'd-1',
  spaceGuid: 's-1',
  cnsiGuid: 'cnsi-1',
  createdAt: '',
  updatedAt: '',
};

describe('AppRoutesPickerComponent', () => {
  it('renders an empty-state message when the routes list is empty', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.routes.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No routes are currently mapped');
  });

  it('renders one row per route with url text and a checkbox', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.routes.set([routeA, routeB]);
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('[data-test="route-checkbox"]');
    expect(boxes.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('app-a.example.com');
    expect(fixture.nativeElement.textContent).toContain('app-b.example.com/api');
  });

  it('emits selectedChange when a checkbox is toggled', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.routes.set([routeA, routeB]);
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('[data-test="route-checkbox"]') as NodeListOf<HTMLInputElement>;
    boxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([routeA]);
    boxes[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([routeA, routeB]);
    boxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([routeB]);
  });

  it('select-all / select-none buttons appear when 2+ routes are shown', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.routes.set([routeA, routeB]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="routes-select-all"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="routes-select-none"]')).not.toBeNull();
  });

  it('select-all / select-none buttons are hidden when only one route is shown', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.routes.set([routeA]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="routes-select-all"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-test="routes-select-none"]')).toBeNull();
  });

  it('select-all selects every route; Clear empties the selection', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.routes.set([routeA, routeB]);
    fixture.detectChanges();
    const selectAll = fixture.nativeElement.querySelector('[data-test="routes-select-all"]') as HTMLButtonElement;
    const clearBtn = fixture.nativeElement.querySelector('[data-test="routes-select-none"]') as HTMLButtonElement;
    selectAll.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([routeA, routeB]);
    clearBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelected).toEqual([]);
  });
});
