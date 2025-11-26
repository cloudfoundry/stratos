import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../core/core.module';
import { EntitySummaryTitleComponent } from './entity-summary-title.component';

describe('EntitySummaryTitleComponent', () => {
  let component: EntitySummaryTitleComponent;
  let fixture: ComponentFixture<EntitySummaryTitleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        EntitySummaryTitleComponent, // Now standalone
        CoreModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySummaryTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
