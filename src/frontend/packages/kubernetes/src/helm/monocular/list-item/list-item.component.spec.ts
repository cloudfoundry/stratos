import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ListItemComponent } from './list-item.component';

/* tslint:disable:no-unused-variable */

describe('Component: ListItem', () => {
  it('should create an instance', () => {
    const component = TestBed.runInInjectionContext(() => new ListItemComponent());
    expect(component).toBeTruthy();
  });
});
