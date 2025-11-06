import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ShowHideButtonComponent } from './show-hide-button.component';

describe('ShowHideButtonComponent', () => {
  let component: ShowHideButtonComponent;
  let fixture: ComponentFixture<ShowHideButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ShowHideButtonComponent
      ],
      
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowHideButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
