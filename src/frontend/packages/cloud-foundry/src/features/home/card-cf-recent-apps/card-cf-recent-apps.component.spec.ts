import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of as observableOf } from 'rxjs';

import { CardCfRecentAppsComponent } from './card-cf-recent-apps.component';

describe('CardCfRecentAppsComponent', () => {
  let component: CardCfRecentAppsComponent;
  let fixture: ComponentFixture<CardCfRecentAppsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardCfRecentAppsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
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
