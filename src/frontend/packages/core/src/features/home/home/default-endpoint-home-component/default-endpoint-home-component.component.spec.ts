import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DefaultEndpointHomeComponent } from './default-endpoint-home-component.component';

describe('DefaultEndpointHomeComponentComponent', () => {
  let component: DefaultEndpointHomeComponent;
  let fixture: ComponentFixture<DefaultEndpointHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ DefaultEndpointHomeComponent ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultEndpointHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
