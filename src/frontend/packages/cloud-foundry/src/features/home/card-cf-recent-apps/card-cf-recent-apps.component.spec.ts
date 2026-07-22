import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of as observableOf } from 'rxjs';

import { CardCfRecentAppsComponent } from './card-cf-recent-apps.component';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';

describe('CardCfRecentAppsComponent', () => {
  let component: CardCfRecentAppsComponent;
  let fixture: ComponentFixture<CardCfRecentAppsComponent>;

  // Stub the registry — placeholderMode tests don't acquire endpoint data,
  // but the field-level inject() runs at construction and would otherwise
  // pull in EndpointDataShim → ngrx Store DI chain.
  const registryStub = {
    acquire: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardCfRecentAppsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointDataRegistry, useValue: registryStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfRecentAppsComponent);
    component = fixture.componentInstance;
    component.allApps$ = observableOf([]);
    component.loading$ = observableOf(false);
    component.placeholderMode = true;

    // Don't call detectChanges() to avoid rendering child components
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
