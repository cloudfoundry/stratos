import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { signal } from '@angular/core';

import { StratosTitleComponent } from './stratos-title.component';
import { StratosThemeService } from '../../../../../theme/theme.service';

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
    } as any);

    const mockThemeService = {
      theme: mockTheme.asReadonly()
    };

    TestBed.configureTestingModule({
      imports: [ StratosTitleComponent ],
      providers: [
        { provide: StratosThemeService, useValue: mockThemeService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StratosTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
