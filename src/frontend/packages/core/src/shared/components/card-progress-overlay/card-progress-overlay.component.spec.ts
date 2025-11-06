import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CardProgressOverlayComponent } from './card-progress-overlay.component';
import { CoreModule } from '../../../core/core.module';

describe('CardProgressOverlayComponent', () => {
  let component: CardProgressOverlayComponent;
  let fixture: ComponentFixture<CardProgressOverlayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardProgressOverlayComponent, // Now standalone
        CoreModule,
      ]
    })
    .compileComponents();
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
