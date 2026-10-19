import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { EndpointsService } from '../../../core/endpoints.service';
import { SharedModule } from '../../shared.module';
import { EndpointsMissingComponent } from './endpoints-missing.component';

describe('EndpointsMissingComponent', () => {
  let component: EndpointsMissingComponent;
  let fixture: ComponentFixture<EndpointsMissingComponent>;

  const mockEndpointsService = {
    haveRegistered$: of(false),
    haveConnected$: of(false),
    disablePersistenceFeatures$: of(false),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsService, useValue: mockEndpointsService },
      ],
      imports: [
        EndpointsMissingComponent,
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        RouterTestingModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(EndpointsMissingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('shows the no-endpoints message when none are registered', async () => {
    await vi.waitFor(() => {
      expect(fixture.nativeElement.textContent).toContain('There are no registered endpoints');
    });
  });
});
