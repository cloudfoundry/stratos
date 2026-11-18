import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutingHistoryService } from '@stratosui/store';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { GlobalEventService } from '../../../shared/global-events.service';
import { EventFilterValues, EventsPageComponent } from './events-page.component';

describe('EventsPageComponent', () => {
  let component: EventsPageComponent;
  let fixture: ComponentFixture<EventsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        RouterTestingModule,
        EventsPageComponent,
      ],
      providers: [
        
        TabNavService,
        CurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('EventsPageComponent logic', () => {
  const previousState = signal<any>({ url: '/applications?x=1' });
  const events = signal<any[]>([]);
  let component: EventsPageComponent;

  beforeEach(() => {
    previousState.set({ url: '/applications?x=1' });
    events.set([
      { key: 'a', message: 'a', link: '', read: false },
      { key: 'b', message: 'b', link: '', read: true },
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: GlobalEventService, useValue: { events, updateEventReadState: vi.fn() } },
        { provide: RoutingHistoryService, useValue: { previousState } },
        { provide: ActivatedRoute, useValue: { snapshot: { url: [], queryParams: {} } } },
      ],
    });
    TestBed.overrideComponent(EventsPageComponent, { set: { imports: [], template: '' } });
    component = TestBed.createComponent(EventsPageComponent).componentInstance;
  });

  it('closes to the page it came from, which later navigations do not move', () => {
    expect(component.back()).toBe('/applications');
    previousState.set({ url: '/events' });
    expect(component.back()).toBe('/applications');
  });

  it('falls back to the unread filter once nothing is read', () => {
    component.selectFilter(EventFilterValues.READ);
    expect(component.events().map(e => e.key)).toEqual(['b']);

    events.set([{ key: 'a', message: 'a', link: '', read: false }]);
    TestBed.tick();
    expect(component.selectedFilterSignal()).toBe(EventFilterValues.UNREAD);
    expect(component.events().map(e => e.key)).toEqual(['a']);
  });
});
