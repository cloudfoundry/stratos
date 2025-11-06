import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { NoServicePlansComponent } from './no-service-plans.component';

describe('NoServicePlansComponent', () => {
  let component: NoServicePlansComponent;
  let fixture: ComponentFixture<NoServicePlansComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ NoServicePlansComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoServicePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
