import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppChipsComponent } from '@stratosui/core';
import {
  StServiceInstance,
} from '../../../../services/endpoint-data/stratos-types';
import { CompactServiceInstanceCardComponent } from './compact-service-instance-card.component';

const instance: StServiceInstance = {
  guid: '250d8795-d49e-4669-acd5-b5cf94f97c7b',
  cnsiGuid: 'cnsi-1',
  name: 'Ntahtntest',
  type: 'managed',
  tags: ['sd', 'asd', 'asf'],
  lastOperation: { type: 'create', state: 'succeeded', description: '', createdAt: '2018-05-22T14:53:29Z', updatedAt: '2018-05-22T14:53:29Z' },
  space: { guid: 'fa4b5a9e-8324-48d9-9de5-491892ec1cb8' },
  servicePlan: { guid: '35f97198-390b-4d88-be93-dc917794b12d' },
  createdAt: '2018-05-22T14:53:29Z',
  updatedAt: '2018-05-22T14:53:29Z',
};

describe('CompactServiceInstanceCardComponent', () => {
  let component: CompactServiceInstanceCardComponent;
  let fixture: ComponentFixture<CompactServiceInstanceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CompactServiceInstanceCardComponent,
        AppChipsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.serviceInstance = instance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the instance name + tags', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Ntahtntest');
    expect(host.textContent).toContain('sd');
  });
});
