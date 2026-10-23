import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UniqueDirective } from './unique.directive';

describe('UniqueDirective', () => {
  it('should create an instance', () => {
    const directive = TestBed.runInInjectionContext(() => new UniqueDirective());
    expect(directive).toBeTruthy();
  });
});
