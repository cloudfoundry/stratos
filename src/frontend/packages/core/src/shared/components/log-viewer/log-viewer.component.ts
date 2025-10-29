import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  fromEvent as observableFromEvent,
  interval as observableInterval,
  NEVER,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import {
  buffer,
  catchError,
  combineLatest,
  defaultIfEmpty,
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

interface ConnectionErrorInfo {
  code: string;
  severity: 'info' | 'warning' | 'error';
  userMessage: string;
  timestamp: number;
  retryable: boolean;
}

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
  ]
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

  private stopped$ = new BehaviorSubject<boolean>(false);
  private colorizer = new AnsiColors();

  // Connection state tracking
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastConnectionError: ConnectionErrorInfo | null = null;

  public maxLogLines = 1000;
  public isHighThroughput$: Observable<boolean>;
  public isLocked$: Observable<boolean>;
  public statusMessage$ = new BehaviorSubject<LogStreamMessage>({ message: '' });
  public connectionErrorInfo$ = new BehaviorSubject<ConnectionErrorInfo | null>(null);

  public ngOnInit() {
    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;

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
              // Connecting
              this.connectionAttempts = 0;
              this.lastConnectionError = null;
              this.connectionErrorInfo$.next(null);
              this.statusMessage$.next({
                message: 'Connecting to log stream...',
                isError: false
              });
              break;
            case 1:
              // Successfully connected
              this.connectionAttempts = 0;
              this.lastConnectionError = null;
              this.connectionErrorInfo$.next(null);
              this.statusMessage$.next({ message: '' });
              console.log('Log stream connected successfully');
              break;
            case -1:
              // Connection failed permanently
              this.connectionAttempts++;
              const errorMsg = this.getDetailedErrorMessage();
              this.lastConnectionError = {
                code: 'WEBSOCKET_FAILED',
                severity: 'error',
                userMessage: errorMsg,
                timestamp: Date.now(),
                retryable: this.connectionAttempts < this.maxReconnectAttempts
              };
              this.connectionErrorInfo$.next(this.lastConnectionError);
              this.statusMessage$.next({
                message: errorMsg,
                isError: true
              });
              console.error('Log stream connection failed:', this.lastConnectionError);
              break;
            case -2:
              // Retrying connection
              this.connectionAttempts++;
              const retryMsg = `Connection lost. Retrying (attempt ${this.connectionAttempts}/${this.maxReconnectAttempts})...`;
              this.statusMessage$.next({
                message: retryMsg,
                isError: false
              });
              console.warn('Log stream retrying connection:', retryMsg);
              break;
            default:
              this.statusMessage$.next({ message: '' });
              break;
          }
        },
        error: err => {
          console.error('Status subscription error:', err);
          this.lastConnectionError = {
            code: 'STATUS_SUBSCRIPTION_ERROR',
            severity: 'error',
            userMessage: 'An error occurred while monitoring the connection. Please refresh the page.',
            timestamp: Date.now(),
            retryable: false
          };
          this.connectionErrorInfo$.next(this.lastConnectionError);
          this.statusMessage$.next({
            message: this.lastConnectionError.userMessage,
            isError: true
          });
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
        map(logs => logs.map(log => {
          try {
            return this.filter ? this.filter(log) : log;
          } catch (filterErr) {
            console.error('Error applying filter to log:', log, filterErr);
            return log; // Fall back to unfiltered log on filter error
          }
        }).filter(log => !!log)),
        filter(log => !!log.length),
        tap(logs => {
          try {
            this.logLinesCount += logs.length;
            const elementString = logs
              .map(log => {
                try {
                  const formatted = this.colorizer.ansiColorsToHtml(log);
                  return `<div>${formatted}</div>`;
                } catch (colorErr) {
                  console.error('Error colorizing log:', log, colorErr);
                  return `<div>${this.escapeHtml(log)}</div>`;
                }
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
          } catch (err) {
            console.error('Error processing log batch:', err);
            // Don't let UI processing errors break the stream
          }
        }),
        startWith([]),
        catchError(err => {
          console.error('Log stream processing error:', err);
          const errorInfo: ConnectionErrorInfo = {
            code: 'LOG_PROCESSING_ERROR',
            severity: 'warning',
            userMessage: 'Error processing log stream. Some logs may be missing.',
            timestamp: Date.now(),
            retryable: true
          };
          this.connectionErrorInfo$.next(errorInfo);
          this.statusMessage$.next({
            message: errorInfo.userMessage,
            isError: true
          });
          // Continue the stream instead of breaking
          return of([]);
        })
      );

    this.listeningSub = observableCombineLatest(this.isLocked$, addedLogs$).pipe(
      tap(([isLocked, logs]) => {
        try {
          if (isLocked) {
            containerElement.scrollTop = contentElement.clientHeight;
          }
        } catch (scrollErr) {
          // Silently fail scroll operations, don't break the stream
          console.warn('Error auto-scrolling log viewer:', scrollErr);
        }
      }))
      .subscribe({
        next: () => {
          // Successfully processing logs
        },
        error: e => {
          console.error('Log viewer subscription error:', e);
          const errorInfo: ConnectionErrorInfo = {
            code: 'LOG_STREAM_ERROR',
            severity: 'error',
            userMessage: 'An error occurred connecting to the log stream. Please refresh the page to reconnect.',
            timestamp: Date.now(),
            retryable: false
          };
          this.lastConnectionError = errorInfo;
          this.connectionErrorInfo$.next(errorInfo);
          this.statusMessage$.next({
            message: errorInfo.userMessage,
            isError: true
          });
        },
        complete: () => {
          console.log('Log stream completed');
          this.statusMessage$.next({
            message: 'Log stream has been closed',
            isError: false
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

  public pause(pause: boolean) {
    if (this.stopped$) {
      this.stopped$.next(pause);
    }
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

  /**
   * Escape HTML special characters to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Generate detailed error message based on connection state
   */
  private getDetailedErrorMessage(): string {
    if (!this.lastConnectionError) {
      return 'Unable to connect to log stream. Please check that the backend service is running and try refreshing the page.';
    }

    const baseMsg = 'Unable to connect to log stream.';
    const actionMsg = this.connectionAttempts >= this.maxReconnectAttempts
      ? 'Maximum retry attempts reached. Please refresh the page to try again.'
      : 'The application will attempt to reconnect automatically.';

    return `${baseMsg} ${actionMsg}`;
  }

  /**
   * Get the last recorded connection error if available
   */
  public getLastError(): ConnectionErrorInfo | null {
    return this.lastConnectionError;
  }

  /**
   * Manually retry connection (can be called by parent component)
   */
  public resetConnectionState(): void {
    this.connectionAttempts = 0;
    this.lastConnectionError = null;
    this.connectionErrorInfo$.next(null);
    this.statusMessage$.next({ message: '' });
    console.log('Connection state reset - ready for retry');
  }

}
