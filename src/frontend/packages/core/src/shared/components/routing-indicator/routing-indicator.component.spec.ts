import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  Event,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationSkippedCode,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureZonelessTestBed } from '@test-framework/zoneless-testbed.helper';
import { AppProgressBarComponent } from '../progress-bar/app-progress-bar.component';
import { RoutingIndicatorComponent } from './routing-indicator.component';

describe('RoutingIndicatorComponent', () => {
  let component: RoutingIndicatorComponent;
  let fixture: ComponentFixture<RoutingIndicatorComponent>;
  let events: Subject<Event>;
  let navId = 0;

  const start = () => events.next(new NavigationStart(++navId, '/next'));
  const end = () => events.next(new NavigationEnd(navId, '/next', '/next'));
  // A lazy route whose chunk 404s (e.g. after a redeploy) ends in this event.
  const error = () => events.next(new NavigationError(navId, '/next', new Error('chunk load failed')));
  const skipped = () => events.next(
    new NavigationSkipped(navId, '/next', 'same url', NavigationSkippedCode.IgnoredSameUrlNavigation)
  );

  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await fixture.whenStable();
  };
  const bar = () => fixture.debugElement.query(By.directive(AppProgressBarComponent));

  beforeEach(async () => {
    // RxJS delay/interval run on the faked timers; requestAnimationFrame stays
    // real so the zoneless scheduler (and whenStable) still settles.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    // Largest steps, so the bar reaches its 95 % ceiling in a few seconds.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    events = new Subject<Event>();
    await configureZonelessTestBed({
      imports: [RoutingIndicatorComponent],
      providers: [{ provide: Router, useValue: { events } }],
    }).compileComponents();
    fixture = TestBed.createComponent(RoutingIndicatorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the bar during a navigation and hides it on NavigationEnd', async () => {
    start();
    await advance(1000);
    expect(bar()).toBeTruthy();

    end();
    await advance(300);
    expect(bar()).toBeNull();
  });

  it('hides the bar when the navigation ends in NavigationError', async () => {
    start();
    await advance(10000);
    expect(bar().componentInstance.value()).toBe(95);

    error();
    await advance(300);
    expect(bar()).toBeNull();
  });

  it('runs the next navigation normally after a NavigationError', async () => {
    start();
    await advance(10000);
    error();
    await advance(300);

    start();
    await advance(1000);
    // A fresh run starts low again instead of sitting at the 95 % ceiling.
    expect(bar()).toBeTruthy();
    expect(bar().componentInstance.value()).toBeLessThan(95);

    end();
    await advance(300);
    expect(bar()).toBeNull();
  });

  it('hides the bar when the navigation ends in NavigationSkipped', async () => {
    start();
    await advance(1000);
    expect(bar()).toBeTruthy();

    skipped();
    await advance(300);
    expect(bar()).toBeNull();
  });
});
