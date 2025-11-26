import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CardStatusComponent } from './card-status.component';

describe('CardStatusComponent', () => {
  let component: CardStatusComponent;
  let fixture: ComponentFixture<CardStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ CardStatusComponent ],
      providers: [ provideZonelessChangeDetection() ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
