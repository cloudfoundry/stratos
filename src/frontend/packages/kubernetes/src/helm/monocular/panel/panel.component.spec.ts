import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PanelComponent } from './panel.component';


describe('Component: Panel', () => {
  it('should create an instance', () => {
    const component = TestBed.runInInjectionContext(() => new PanelComponent());
    expect(component).toBeTruthy();
  });
});
