import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { MDAppModule } from '../../../core/md.module';
import { SidePanelService } from './../../services/side-panel.service';
import { SidepanelPreviewComponent } from './sidepanel-preview.component';

describe('SidepanelPreviewComponent', () => {
  let component: SidepanelPreviewComponent;
  let fixture: ComponentFixture<SidepanelPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SidePanelService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        SidepanelPreviewComponent,
        MDAppModule,
        RouterTestingModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidepanelPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The close glyph is ligature text; unlabelled, the button read "close".
  it('names the close button by its purpose', async () => {
    await fixture.whenStable();
    const close = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close');
    expect(close.querySelector('app-custom-icon')!.getAttribute('aria-hidden')).toBe('true');
  });
});
