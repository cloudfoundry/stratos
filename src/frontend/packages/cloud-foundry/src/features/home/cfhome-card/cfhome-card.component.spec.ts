import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsyncPipe } from '@angular/common';
import { Component, Input, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, Subject } from 'rxjs';

import { ApplicationDeploySourceTypes } from '../../applications/deploy-application/deploy-application-steps.types';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { StApp } from '../../../services/endpoint-data/stratos-types';
import { CardCfRecentAppsComponent } from '../card-cf-recent-apps/card-cf-recent-apps.component';
import { CFHomeCardComponent } from "./cfhome-card.component";

describe('CFHomeCardComponent', () => {
  let component: CFHomeCardComponent;
  let fixture: ComponentFixture<CFHomeCardComponent>;

  // Mock services
  const mockAppDeploySourceTypes = {
    types$: of([])
  };

  const mockCdr = {
    markForCheck: vi.fn(),
    detectChanges: vi.fn(),
    detach: vi.fn(),
    reattach: vi.fn(),
    checkNoChanges: vi.fn()
  };

  const mockEndpointDataService = {
    appCount: signal(0),
    orgCount: signal(0),
    routeCount: signal(0),
    isLoading: signal(false),
    lastFetched: signal(null as Date | null),
    loaded$: new Subject<void>(),
  };

  const mockEndpointDataRegistry = {
    acquire: vi.fn(() => mockEndpointDataService),
    release: vi.fn(),
    configure: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CFHomeCardComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: EndpointDataRegistry, useValue: mockEndpointDataRegistry },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .overrideComponent(CFHomeCardComponent, {
      set: {
        providers: [
          { provide: ApplicationDeploySourceTypes, useValue: mockAppDeploySourceTypes },
        ],
      },
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CFHomeCardComponent);
    component = fixture.componentInstance;
    // Set required inputs before detectChanges
    component.endpoint = { guid: 'test-guid' } as any;
    component.layout = { x: 1, y: 1 } as any;
    // Don't call detectChanges() to avoid complex initialization
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Stands in for the recent-apps card so the spec sees exactly the list the
// home card hands it.
@Component({
  selector: 'app-card-cf-recent-apps',
  standalone: true,
  imports: [AsyncPipe],
  template: `@for (app of (allApps$ | async) ?? []; track app.metadata.guid) {<span class="stub-app">{{ app.entity.name }}:{{ app.entity.state }}</span>}`,
})
class StubRecentAppsComponent {
  @Input() allApps$!: Observable<any[]>;
  @Input() hideWhenEmpty = false;
  @Input() noStats = false;
  @Input() dateMode!: string;
  @Input() showDate = true;
  @Input() maxRows = 10;
  @Input() mode!: string;
  @Input() endpoint!: string;
  @Input() placeholderMode = false;
}

describe('CFHomeCardComponent follows the endpoint data (#6021)', () => {
  const app = (state: string): StApp =>
    ({ guid: 'app-1', name: 'one', state, updatedAt: '2026-01-01T00:00:00Z' } as StApp);

  let fixture: ComponentFixture<CFHomeCardComponent>;
  let eds: {
    appCount: ReturnType<typeof signal<number>>;
    orgCount: ReturnType<typeof signal<number>>;
    routeCount: ReturnType<typeof signal<number>>;
    recentApps: ReturnType<typeof signal<StApp[]>>;
    lastFetched: ReturnType<typeof signal<Date | null>>;
    loaded$: Subject<void>;
  };

  beforeEach(async () => {
    // Warm cache: load() resolves at once, as on a revisit of the home page.
    eds = {
      appCount: signal(1),
      orgCount: signal(1),
      routeCount: signal(0),
      recentApps: signal([app('STARTED')]),
      lastFetched: signal<Date | null>(new Date()),
      loaded$: new Subject<void>(),
    };
    await TestBed.configureTestingModule({
      imports: [CFHomeCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointDataRegistry, useValue: { acquire: () => eds, release: vi.fn() } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(CFHomeCardComponent, {
        set: { providers: [{ provide: ApplicationDeploySourceTypes, useValue: mockTypes }] },
      })
      .overrideComponent(CFHomeCardComponent, {
        remove: { imports: [CardCfRecentAppsComponent] },
        add: { imports: [StubRecentAppsComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CFHomeCardComponent);
    fixture.componentInstance.endpoint = { guid: 'test-guid' } as any;
    fixture.componentInstance.layout = { x: 1, y: 1 } as any;
    fixture.componentInstance.load().subscribe();
    await fixture.whenStable();
  });

  const mockTypes = { types$: of([]) };
  const shown = () => Array.from(fixture.nativeElement.querySelectorAll('.stub-app'))
    .map((el: any) => el.textContent);
  const noApps = () => fixture.nativeElement.querySelector('.cf-home-card__no-apps');

  it('shows a state change made after load', async () => {
    expect(shown()).toEqual(['one:STARTED']);
    eds.recentApps.set([app('STOPPED')]);
    await fixture.whenStable();
    expect(shown()).toEqual(['one:STOPPED']);
  });

  it('shows the no-apps message when the last app is deleted', async () => {
    expect(noApps()).toBeNull();
    eds.recentApps.set([]);
    eds.appCount.set(0);
    await fixture.whenStable();
    expect(noApps()).not.toBeNull();
  });
});
