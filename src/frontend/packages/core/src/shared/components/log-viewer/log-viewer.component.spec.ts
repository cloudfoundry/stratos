import { Component, CUSTOM_ELEMENTS_SCHEMA, provideZonelessChangeDetection, signal, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, from as observableFrom, Observable, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { LogViewerComponent } from './log-viewer.component';

describe('LogViewerComponent', () => {
  @Component({
    standalone: true,
    selector: `app-host-component`,
    template: `<app-log-viewer [logStream]="stream()"></app-log-viewer>`,
    imports: [LogViewerComponent]
  })
  class TestHostComponent {
    @ViewChild(LogViewerComponent, { static: true })
    public logViewer!: LogViewerComponent;
    readonly stream = signal<Observable<string> | undefined>(undefined);
  }

  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let stream: Subject<string>;
  let contentEl: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        LogViewerComponent,
        TestHostComponent,
        MDAppModule,
        RouterTestingModule,
        CoreModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
      TestBed.compileComponents();
  });

  // Binds a stream and waits for the viewer to switch to it.
  const show = async (next: Observable<string>) => {
    component.stream.set(next);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    contentEl = component.logViewer.content().nativeElement as HTMLDivElement;
    stream = new Subject();
    await show(stream);
  });

  it('should be created', async () => {
    await show(observableFrom('jhgjgh'));
    expect(component).toBeTruthy();
  });

  // WCAG 2.1.1: a keyboard user can scroll the log, so the scroll box
  // takes focus (it holds no control of its own) and has a name.
  it('lets the keyboard reach the scroll box', () => {
    const scroller = fixture.nativeElement.querySelector('.log-scroller') as HTMLElement;
    expect(scroller.getAttribute('tabindex')).toBe('0');
    expect(scroller.getAttribute('role')).toBe('region');
    expect(scroller.getAttribute('aria-label')).toBe('Log');
  });

  it('should add logline from observable', async () => {
    const logText = 'Log';
    expect(contentEl.children.length).toEqual(0);

    // Emit the log line
    stream.next('Log');

    // Wait for buffering and processing - the component uses buffer() with intervals
    // Need to wait for sampleTime(500) + buffer processing + DOM update
    await vi.waitFor(
      () => {
        expect(contentEl.children.length).toEqual(1);
      },
      { timeout: 2000, interval: 50 }
    );

    expect(contentEl.children[0].children[0].innerHTML).toEqual(logText);
  }, 3000);

  describe('when the log stream changes', () => {
    const shown = async (text: string) => vi.waitFor(() => expect(contentEl.textContent).toContain(text));

    it('clears the lines of the previous stream', async () => {
      stream.next('old');
      await shown('old');

      const next = new Subject<string>();
      await show(next);
      expect(contentEl.children.length).toEqual(0);
      next.next('new');
      await shown('new');

      expect(contentEl.textContent).not.toContain('old');
    });

    it('drops lines of the previous stream it had not shown yet', async () => {
      stream.next('stale');
      const next = new Subject<string>();
      await show(next);
      next.next('new');
      await shown('new');

      expect(contentEl.textContent).not.toContain('stale');
    });

    it('keeps the lines when given the same stream again', async () => {
      stream.next('kept');
      await shown('kept');

      await show(stream);

      expect(contentEl.textContent).toContain('kept');
    });
  });

  it('should only allow max rows', async () => {
    expect(contentEl.children.length).toEqual(0);

    // Verify initial state is not high throughput
    const initialHighThroughput = await firstValueFrom(
      component.logViewer.isHighThroughput$.pipe(take(1))
    );
    expect(initialHighThroughput).toEqual(false);

    component.logViewer.maxLogLines = 5;

    const maxLines = component.logViewer.maxLogLines + 1;

    // Send logs with spacing > 300ms to avoid high throughput mode
    for (let i = 0; i < maxLines; i++) {
      stream.next(`Log ${i}`);
      // Wait longer than highThroughputTimeMS (300ms) between emissions
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Wait for all buffering and processing to complete
    await vi.waitFor(
      () => {
        expect(contentEl.children.length).toEqual(component.logViewer.maxLogLines);
      },
      { timeout: 3000, interval: 100 }
    );
  }, 10000);

  it('should be in high throughput mode', async () => {
    expect(contentEl.children.length).toEqual(0);

    // Verify initial state is not high throughput
    const initialHighThroughput = await firstValueFrom(
      component.logViewer.isHighThroughput$.pipe(take(1))
    );
    expect(initialHighThroughput).toEqual(false);

    // The component's high throughput detection:
    // - timeInterval() measures time between emissions
    // - sampleTime(500) samples every 500ms
    // - If sampled interval < 300ms, high throughput = true
    //
    // Strategy: Emit logs continuously at 100ms intervals (< 300ms threshold)
    // After 600ms, sampleTime should have sampled and detected high throughput

    const rapidInterval = 100; // 100ms < 300ms threshold

    // Create a promise that listens for high throughput mode
    const highThroughputPromise = firstValueFrom(
      component.logViewer.isHighThroughput$.pipe(
        filter(high => high === true),
        take(1)
      )
    );

    // Start emitting logs rapidly
    let count = 0;
    const emitInterval = setInterval(() => {
      stream.next(`Log ${count}`);
      count++;
    }, rapidInterval);

    try {
      // Wait for high throughput to be detected (with timeout)
      const isHigh = await Promise.race([
        highThroughputPromise,
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('High throughput detection timeout')), 3000)
        )
      ]);

      expect(isHigh).toEqual(true);
    } finally {
      // Clean up interval
      clearInterval(emitInterval);
    }
  }, 5000);

});
