import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect } from 'vitest';

import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';
import { EventDetailComponent, hasEventMetadata, parseEventData } from './event-detail.component';

describe('parseEventData', () => {
  it('parses a JSON object string', () => {
    expect(parseEventData('{"request":{"name":"web"}}')).toEqual({ request: { name: 'web' } });
  });
  it('returns {} for null / empty / "{}"', () => {
    expect(parseEventData(null)).toEqual({});
    expect(parseEventData('')).toEqual({});
    expect(parseEventData('{}')).toEqual({});
  });
  it('returns {} for invalid JSON (never throws)', () => {
    expect(parseEventData('{not json')).toEqual({});
  });
  it('wraps a scalar / array payload under `value`', () => {
    expect(parseEventData('"hello"')).toEqual({ value: 'hello' });
    expect(parseEventData('[1,2]')).toEqual({ value: [1, 2] });
  });
});

describe('hasEventMetadata', () => {
  it('is false for empty / missing data', () => {
    expect(hasEventMetadata('{}')).toBe(false);
    expect(hasEventMetadata(null)).toBe(false);
    expect(hasEventMetadata('')).toBe(false);
  });
  it('is true when the event carries data', () => {
    expect(hasEventMetadata('{"a":1}')).toBe(true);
  });
});

describe('EventDetailComponent (dialog)', () => {
  function setup(type: string, metadata: Record<string, unknown>) {
    TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MAT_DIALOG_DATA, useValue: { type, metadata } },
        { provide: TailwindDialogRef, useValue: { close: () => undefined } },
      ],
    });
    const fixture: ComponentFixture<EventDetailComponent> = TestBed.createComponent(EventDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('titles the dialog with the event type', () => {
    const fixture = setup('audit.app.map-route', { route_guid: 'r1' });
    expect(fixture.nativeElement.innerHTML).toContain('audit.app.map-route');
  });

  it('renders the metadata as formatted (indented) JSON', () => {
    const fixture = setup('audit.app.update', { request: { name: 'web' } });
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre.textContent).toContain('"request"');
    expect(pre.textContent).toMatch(/\n\s{2,}"/); // pretty-printed → indented
  });
});
