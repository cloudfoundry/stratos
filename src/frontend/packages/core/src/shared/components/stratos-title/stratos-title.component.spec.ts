import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {  signal, provideZonelessChangeDetection } from '@angular/core';

import { StratosTitleComponent } from './stratos-title.component';
import { StratosThemeService } from '@stratosui/theme';

describe('StratosTitleComponent', () => {
  let component: StratosTitleComponent;
  let fixture: ComponentFixture<StratosTitleComponent>;

  beforeEach(() => {
    const mockTheme = signal({
      branding: {
        companyName: 'Test Company',
        loginTitle: 'Test Title',
        loginSubtitle: 'Test Subtitle',
        logo: '/test-logo.png'
      }
    } as Parameters<typeof signal>[0]);

    const mockThemeService = {
      theme: mockTheme.asReadonly(),
    };

    TestBed.configureTestingModule({
      imports: [ StratosTitleComponent ],
      providers: [

        { provide: StratosThemeService, useValue: mockThemeService },

        provideZonelessChangeDetection(),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StratosTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
