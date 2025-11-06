import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MultilineTitleComponent } from './multiline-title.component';

describe('MultilineTitleComponent', () => {
  let component: MultilineTitleComponent;
  let fixture: ComponentFixture<MultilineTitleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ MultilineTitleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultilineTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
