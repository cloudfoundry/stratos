import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ApplicationStateIconComponent } from './application-state-icon.component';

describe('ApplicationStateIconComponent', () => {
  let component: ApplicationStateIconComponent;
  let fixture: ComponentFixture<ApplicationStateIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ApplicationStateIconComponent
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStateIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
