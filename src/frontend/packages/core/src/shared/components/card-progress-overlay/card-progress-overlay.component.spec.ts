import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CardProgressOverlayComponent } from './card-progress-overlay.component';
import { CoreModule } from '../../../core/core.module';

describe('CardProgressOverlayComponent', () => {
  let component: CardProgressOverlayComponent;
  let fixture: ComponentFixture<CardProgressOverlayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CardProgressOverlayComponent, // Now standalone
        CoreModule,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardProgressOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
