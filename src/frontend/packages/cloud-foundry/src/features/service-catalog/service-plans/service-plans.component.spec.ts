import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService } from '@stratosui/core';

import { ServicePlansComponent } from './service-plans.component';

describe('ServicePlansComponent', () => {
  let component: ServicePlansComponent;
  let fixture: ComponentFixture<ServicePlansComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServicePlansComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        // Stub the permissions service to short-circuit the
        // CurrentUserRolesDataService → ngrx Store chain. The per-row
        // Create Instance action reads .can() to gate its disabled state;
        // the spec just needs the signal to resolve without injection
        // errors. Default to false (lacking permission) so the kebab
        // item renders as disabled — matches the safer fallback.
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(false) } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // No route guids means no fetch — drain anything that did fire so
    // the verify() below doesn't trip.
    httpMock.match(() => true).forEach(req => req.flush({ resources: [] }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds a SignalListConfig wired to the plans signal config', () => {
    expect(component.listConfig).toBeDefined();
    expect(component.listConfig?.columns.length).toBeGreaterThan(0);
    const headers = component.listConfig!.columns.map(c => c.header);
    expect(headers).toContain('Name');
    expect(headers).toContain('Description');
    expect(headers).toContain('Public');
    expect(headers).toContain('Cost');
    expect(headers).toContain('Creation Date');
  });
});
