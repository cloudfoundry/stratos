import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { endpointEventKey, GlobalEventService } from '../../../global-events.service';
import { PageHeaderEventsComponent } from './page-header-events.component';

describe('PageHeaderEventsComponent', () => {
  let component: PageHeaderEventsComponent;
  let fixture: ComponentFixture<PageHeaderEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PageHeaderEventsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {}
            }
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageHeaderEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('PageHeaderEventsComponent dismiss', () => {
  // The banner's dismiss control was a clickable icon: no Tab stop, and its
  // only name was the glyph text "clear".
  it('dismisses the error from a named button', async () => {
    const event = { key: `${endpointEventKey}-ep-1`, endpointId: 'ep-1', message: 'Endpoint down', read: false };
    const updateEventReadState = vi.fn();
    TestBed.configureTestingModule({
      imports: [PageHeaderEventsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: GlobalEventService, useValue: { events: signal([event]), updateEventReadState } },
      ],
    });
    const fixture = TestBed.createComponent(PageHeaderEventsComponent);
    fixture.componentRef.setInput('endpointIds', ['ep-1']);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]');
    expect(button).not.toBeNull();
    button!.click();
    expect(updateEventReadState).toHaveBeenCalledWith(event, true);
  });

  // In dark mode the fixed danger shades put the banner text at 2.2-4.4:1
  // (#4166). The theme's alert tokens change with the mode; the link takes
  // the alert text color (the link blue is under 4.5:1 on the alert tint).
  it('draws the banner in the theme alert colors', async () => {
    TestBed.configureTestingModule({
      imports: [PageHeaderEventsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: GlobalEventService, useValue: {
          events: signal([{ key: `${endpointEventKey}-ep-1`, endpointId: 'ep-1', endpointName: 'one', detail: 'HTTP 502', message: 'down', read: false }]),
          updateEventReadState: vi.fn(),
        } },
      ],
    });
    const fixture = TestBed.createComponent(PageHeaderEventsComponent);
    fixture.componentRef.setInput('endpointIds', ['ep-1']);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const banner = el.querySelector('h3')!.closest('.rounded-md')!;
    expect(banner.className).toContain('bg-[var(--danger-bg)]');
    expect(banner.className).toContain('text-[var(--danger-text)]');
    expect(el.innerHTML).not.toMatch(/text-danger-shade-|text-primary/);
  });
});

describe('PageHeaderEventsComponent watched endpoints', () => {
  const events = [
    { key: `${endpointEventKey}-ep-1`, endpointId: 'ep-1', message: 'One down', read: false },
    { key: `${endpointEventKey}-ep-2`, endpointId: 'ep-2', message: 'Two down', read: false },
  ];
  function create(params: Record<string, string>) {
    TestBed.configureTestingModule({
      imports: [PageHeaderEventsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
        { provide: GlobalEventService, useValue: { events: signal(events), updateEventReadState: vi.fn() } },
      ],
    });
    return TestBed.createComponent(PageHeaderEventsComponent);
  }

  it('watches the route endpoint when no ids are bound', async () => {
    const fixture = create({ endpointId: 'ep-2' });
    await fixture.whenStable();
    expect(fixture.componentInstance.errorMessage()).toBe('Two down');
  });

  it('watches the bound ids over the route endpoint', async () => {
    const fixture = create({ endpointId: 'ep-2' });
    fixture.componentRef.setInput('endpointIds', ['ep-1']);
    await fixture.whenStable();
    expect(fixture.componentInstance.errorMessage()).toBe('One down');
  });
});
