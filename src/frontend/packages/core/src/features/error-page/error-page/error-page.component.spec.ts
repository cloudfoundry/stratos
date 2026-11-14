import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  entityCatalog,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EndpointErrorEventsService,
  EndpointsDataService,
  RoutingHistoryService,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';
import { eventReturnUrlParam } from '../../event-page/events-page/events-page.component';
import { ErrorPageComponent } from './error-page.component';

describe('ErrorPageComponent', () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;

  beforeEach(async () => {
    // Clear and register entities BEFORE TestBed configuration for Angular 20
    (entityCatalog as any).clear();
    const entities = generateStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        ErrorPageComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('ErrorPageComponent Close link', () => {
  const previousState = signal<any>(null);
  let component: ErrorPageComponent;

  beforeEach(() => {
    previousState.set({ url: '/events?filter=all' });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: RoutingHistoryService, useValue: { previousState } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: { [eventReturnUrlParam]: '/applications' } } } },
      ],
    });
    TestBed.overrideComponent(ErrorPageComponent, { set: { imports: [], template: '' } });
    component = TestBed.createComponent(ErrorPageComponent).componentInstance;
  });

  it('closes to the events page with its return url, and later navigations do not move it', () => {
    expect(component.back()).toBe('/events');
    expect(component.backParams()).toEqual({ [eventReturnUrlParam]: '/applications' });
    previousState.set({ url: '/home' });
    expect(component.back()).toBe('/events');
  });
});

describe('ErrorPageComponent for an endpoint', () => {
  const errors = signal<any[]>([]);
  const endpoint = signal<any>({ guid: 'ep-1', name: 'My CF' });

  beforeEach(async () => {
    errors.set([]);
    endpoint.set({ guid: 'ep-1', name: 'My CF' });
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule, ErrorPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { endpointId: 'ep-1' }, queryParams: {} } } },
        { provide: RoutingHistoryService, useValue: { previousState: signal(null) } },
        { provide: EndpointsDataService, useValue: { endpointById: () => endpoint, endpoints: () => new Map() } },
        { provide: EndpointErrorEventsService, useValue: { errorsForEndpoint: () => errors, clearEndpoint: () => undefined, eventsByEndpoint: () => new Map() } },
      ],
    }).compileComponents();
  });

  // The page lists the endpoint's backend (5xx) errors of the last half hour
  // and offers them as a download.
  it('lists recent backend errors and follows the endpoint and its history', async () => {
    const fixture = TestBed.createComponent(ErrorPageComponent);
    await fixture.whenStable();
    const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
    expect(text()).toContain('No recent errors');

    const recent = { eventCode: '502', message: 'Bad gateway', timestamp: Date.now(), metadata: {} };
    const old = { eventCode: '500', message: 'Too old', timestamp: Date.now() - 3600_000, metadata: {} };
    const client = { eventCode: '404', message: 'Not found', timestamp: Date.now(), metadata: {} };
    errors.set([recent, old, client]);
    await fixture.whenStable();
    expect(text()).toContain('Bad gateway');
    expect(text()).not.toContain('Too old');
    expect(text()).not.toContain('Not found');
    expect(fixture.nativeElement.querySelector('a[download]').getAttribute('href')).toContain('data:text/json');

    endpoint.set({ guid: 'ep-1', name: 'Renamed' });
    await fixture.whenStable();
    expect(fixture.componentInstance.errorDetails()?.endpoint?.name).toBe('Renamed');
  });
});
