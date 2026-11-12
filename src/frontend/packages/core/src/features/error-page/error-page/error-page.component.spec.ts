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

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
