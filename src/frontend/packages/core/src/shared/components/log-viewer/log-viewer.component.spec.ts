import { Component, CUSTOM_ELEMENTS_SCHEMA, provideZonelessChangeDetection, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, from as observableFrom, Subject } from 'rxjs';
import { filter, first, take } from 'rxjs/operators';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { LogViewerComponent } from './log-viewer.component';

describe('LogViewerComponent', () => {
  @Component({
    standalone: true,
    selector: `app-host-component`,
    template: `<app-log-viewer></app-log-viewer>`,
    imports: [LogViewerComponent]
  })
  class TestHostComponent {
    @ViewChild(LogViewerComponent, { static: true })
    public logViewer!: LogViewerComponent;
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

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    contentEl = component.logViewer.content.nativeElement as HTMLDivElement;
    stream = new Subject();
    component.logViewer.logStream = stream;
    fixture.detectChanges();
  });

  it('should be created', () => {
    component.logViewer.logStream = observableFrom('jhgjgh');
    expect(component).toBeTruthy();
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
        fixture.detectChanges();
        expect(contentEl.children.length).toEqual(1);
      },
      { timeout: 2000, interval: 50 }
    );

    expect(contentEl.children[0].children[0].innerHTML).toEqual(logText);
  }, 3000);

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
        fixture.detectChanges();
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
        first()
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
