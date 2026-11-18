import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EnumerateComponent } from './enumerate.component';

describe('EnumerateComponent', () => {
  let component: EnumerateComponent;
  let fixture: ComponentFixture<EnumerateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ EnumerateComponent ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnumerateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();

  it('shows None without a collection', async () => {
    await fixture.whenStable();
    expect(text()).toBe('None');
  });

  it('lists the items, by label path when given', async () => {
    fixture.componentRef.setInput('collection', ['a', 'b']);
    await fixture.whenStable();
    expect(text()).toBe('a, b');

    fixture.componentRef.setInput('collection', [{ username: 'x' }, { username: 'y' }]);
    fixture.componentRef.setInput('labelPath', 'username');
    await fixture.whenStable();
    expect(text()).toBe('x, y');
  });

  it('shows None for an empty collection', async () => {
    fixture.componentRef.setInput('collection', []);
    await fixture.whenStable();
    expect(text()).toBe('None');
  });
});
