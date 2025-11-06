import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DesktopSettingsComponent } from './desktop-settings.component';

describe('DesktopSettingsComponent', () => {
  let component: DesktopSettingsComponent;
  let fixture: ComponentFixture<DesktopSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ DesktopSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DesktopSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
