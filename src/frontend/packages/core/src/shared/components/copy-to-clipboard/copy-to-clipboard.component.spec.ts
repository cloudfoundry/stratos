import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { CopyToClipboardComponent } from './copy-to-clipboard.component';

describe('CopyToClipboardComponent', () => {
  let component: CopyToClipboardComponent;
  let fixture: ComponentFixture<CopyToClipboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ],
      imports: [
        CopyToClipboardComponent, // Now standalone
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyToClipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the copy icon in normal flow (not absolutely positioned), stacked via grid', () => {
    component.canCopy = true;
    fixture.detectChanges();

    const icons = Array.from(
      fixture.nativeElement.querySelectorAll('.material-icons'),
    ) as HTMLElement[];
    const copyIcon = icons.find(el => el.textContent?.trim() === 'content_copy');

    expect(copyIcon).toBeTruthy();
    // Absolute positioning was the cause of the row-misalignment — the icon
    // must flow so it tracks its row.
    expect(copyIcon!.classList.contains('absolute')).toBe(false);
    // Icon + transient success indicator share one grid cell, so the column
    // reserves space for the "Copied to clipboard" text without overlap.
    expect(fixture.nativeElement.querySelector('.inline-grid')).toBeTruthy();
  });
});
