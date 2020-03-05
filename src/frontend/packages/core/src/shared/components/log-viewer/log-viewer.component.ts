import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  fromEvent as observableFromEvent,
  interval as observableInterval,
  NEVER,
  Observable,
  Subscription,
} from 'rxjs';
import {
  buffer,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  sampleTime,
  share,
  startWith,
  switchMap,
  tap,
  throttle,
  timeInterval,
} from 'rxjs/operators';

import { AnsiColors } from './ansi-colors';


interface LogStreamMessage {
  message: string;
  isError?: boolean;
}

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogViewerComponent implements OnInit, OnDestroy {

  @Input() filter: (a: any) => void;

  @Input() status: Observable<number>;

  @Input() logStream: Observable<any>;

  @ViewChild('container', { static: true }) container: ElementRef;

  @ViewChild('content', { static: true }) content: ElementRef;

  private logLinesCount = 0;
  private countAttribute = 'batchLength';

  private highThroughputTimeMS = 300; // If the time interval between log emits is less then we're in high throughput mode
  private highThroughputBufferIntervalMS = 100; // Buffer time for high through mode

  private listeningSub: Subscription;
  private statusSub: Subscription;
  private resizeSub: Subscription;

  private stopped$: BehaviorSubject<boolean>;
  private colorizer = new AnsiColors();

  public maxLogLines = 1000;
  public isHighThroughput$: Observable<boolean>;
  public isLocked$: Observable<boolean>;
  public statusMessage$ = new BehaviorSubject<LogStreamMessage>({ message: '' });

  public ngOnInit() {
    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;

    this.stopped$ = new BehaviorSubject<boolean>(false);

    const stoppableLogStream$ = this.stopped$.pipe(
      switchMap(
        stopped => (stopped ? NEVER : this.logStream)
      ),
      share()
    );

    if (this.status) {
      this.statusSub = this.status.subscribe({
        next: wsStatus => {
          switch (wsStatus) {
            case 0:
              this.statusMessage$.next({ message: 'Connecting....' });
              break;
            default:
              this.statusMessage$.next({ message: '' });
              break;
          }
        }
      });
    }

    // Locked indicates auto-scroll - scroll position is "locked" to the bottom
    // If the user scrolls off the bottom then disable auto-scroll
    this.isLocked$ = observableFromEvent<MouseEvent>(
      containerElement,
      'scroll'
    ).pipe(
      map(() => {
        return containerElement.scrollTop + containerElement.clientHeight >= contentElement.clientHeight;
      }),
      startWith(true)
    );

    // When we resize the window, we need to re-enable auto-scroll - if the height changes
    // we will determine that the user scrolled off the bottom, when in fact this is due to the resize event
    this.resizeSub = observableFromEvent(window, 'resize').pipe(
      combineLatest(this.isLocked$))
      .subscribe(([event, locked]) => {
        if (locked) {
          this.scrollToBottom();
        }
      });

    this.isHighThroughput$ = stoppableLogStream$.pipe(
      timeInterval(),
      sampleTime(500),
      map(x => {
        const high = x.interval < this.highThroughputTimeMS;
        return high;
      }),
      distinctUntilChanged(),
      startWith(false));

    const buffer$ = observableInterval().pipe(
      combineLatest(this.isHighThroughput$),
      throttle(([t, high]) => {
        return observableInterval(
          high ? this.highThroughputBufferIntervalMS : 0
        );
      }));

    const addedLogs$ = stoppableLogStream$.pipe(
      buffer(buffer$))
      .pipe(
        filter(log => !!log.length),
        // Apply filter to messages if applicable
        map(logs => logs.map(log => this.filter ? this.filter(log) : log).filter(log => !!log)),
        filter(log => !!log.length),
        tap(logs => {
          this.logLinesCount += logs.length;
          const elementString = logs
            .map(log => {
              const formatted = this.colorizer.ansiColorsToHtml(log);
              return `<div>${formatted}</div>`;
            })
            .join('');
          let removedElement;
          if (this.logLinesCount > this.maxLogLines) {
            removedElement = this.binElement();
          }
          const ele =
            removedElement || (document.createElement('div') as HTMLDivElement);
          if (logs.length > 1) {
            ele.setAttribute(this.countAttribute, '' + logs.length);
          }
          ele.innerHTML = elementString;
          contentElement.append(ele);
        })
      );

    this.listeningSub = observableCombineLatest(this.isLocked$, addedLogs$).pipe(
      tap(([isLocked, logs]) => {
        if (isLocked) {
          containerElement.scrollTop = contentElement.clientHeight;
        }
      }))
      .subscribe({
        error: e => {
          this.statusMessage$.next({
            message: 'An error occurred connecting to the log stream websocket',
            isError: true
          });
        }
      });
  }

  public ngOnDestroy(): void {
    if (this.listeningSub) {
      this.listeningSub.unsubscribe();
    }
    if (this.statusSub) {
      this.statusSub.unsubscribe();
    }
    if (this.resizeSub) {
      this.resizeSub.unsubscribe();
    }
  }

  public scrollToBottom() {
    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;
    containerElement.scrollTop = contentElement.clientHeight;
  }

  public pause(pause) {
    this.stopped$.next(pause);
  }

  private binElement() {
    const toRemove = this.content.nativeElement.firstChild;
    if (!toRemove) {
      return null;
    }
    const removedEle = this.content.nativeElement.removeChild(toRemove);
    this.logLinesCount -= removedEle.getAttribute(this.countAttribute) || 1;
    return removedEle;
  }

}
