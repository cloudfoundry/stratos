import { provideZonelessChangeDetection, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SidePanelService } from './side-panel.service';

describe('SidePanelService', () => {
  let service: SidePanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    service = TestBed.inject(SidePanelService);
    service.setContainer({ length: 0, clear: () => {} } as unknown as ViewContainerRef);
  });

  afterEach(() => document.body.classList.remove(SidePanelService.OPEN_CLASS));

  // Full-screen dialogs key off this class to stop short of the panel, so the
  // panel no longer covers their right-hand controls (close, Connect).
  it('marks the body while the panel is open', () => {
    service.open();
    expect(document.body.classList.contains(SidePanelService.OPEN_CLASS)).toBe(true);

    service.hide();
    expect(document.body.classList.contains(SidePanelService.OPEN_CLASS)).toBe(false);
  });

  it('clears the mark when the panel is cleared', () => {
    service.open();
    service.clear();
    expect(document.body.classList.contains(SidePanelService.OPEN_CLASS)).toBe(false);
  });
});
