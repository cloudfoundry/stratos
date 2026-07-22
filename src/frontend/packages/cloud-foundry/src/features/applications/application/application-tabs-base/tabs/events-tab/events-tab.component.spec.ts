import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppDetailDataService } from '../../../../../../features/applications/app-detail-data.service';
import { EventsTabComponent } from './events-tab.component';

describe('EventsTabComponent', () => {
  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  /** Minimal AppDetailDataService stub — only appGuid is consumed by this tab. */
  const makeDataStub = () => ({
    appGuid: 'test-app-guid',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EventsTabComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: AppDetailDataService, useFactory: makeDataStub },
      ],
    })
    // Strip the CloudFoundryEventsListComponent import to avoid its deep
    // dependency tree (CloudFoundryEndpointService → ActiveRouteCfOrgSpace etc.)
    // in unit tests. The component logic under test is just the injection + binding.
    .overrideComponent(EventsTabComponent, {
      set: { imports: [] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsTabComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
