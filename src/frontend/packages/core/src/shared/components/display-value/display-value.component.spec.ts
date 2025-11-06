import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DisplayValueComponent } from './display-value.component';

describe('DisplayValueComponent', () => {
  let component: DisplayValueComponent;
  let fixture: ComponentFixture<DisplayValueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ DisplayValueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
