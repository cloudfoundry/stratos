import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs/Rx';

import { AnsiColors } from './ansi-colors';

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogViewerComponent implements OnInit, OnDestroy {

  @Input('filter') filter: Function;

  @Input('status') status: Observable<number>;

  @Input('logStream') logStream: Observable<any>;

  @ViewChild('container') container: ElementRef;

  @ViewChild('content') content: ElementRef;

  private logLinesCount = 0;
  private maxLogLines = 1000;
  private countAttribute = 'batchLength';

  private highThroughputTimeMS = 300; // If the time interval between log emits is less then we're in high throughput mode
  private highThroughputBufferIntervalMS = 100; // Buffer time for high through mode

  private listeningSub: Subscription;
  private statusSub: Subscription;
  private resizeSub: Subscription;

  private stopped$: BehaviorSubject<boolean>;
  private isHighThroughput$: Observable<boolean>;
  private colorizer = new AnsiColors();

  public isLocked$: Observable<boolean>;
  public message: string;

  public ngOnInit() {
    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;

    this.stopped$ = new BehaviorSubject<boolean>(false);

    const stoppableLogStream$ = this.stopped$.switchMap(
      stopped => (stopped ? Observable.never() : this.logStream)
    );

    // Locked indicates auto-scroll - scroll position is "locked" to the bottom
    // If the user scrolls off the bottom then disable auto-scroll
    this.isLocked$ = Observable.fromEvent<MouseEvent>(
      containerElement,
      'scroll'
    )
      .scan(() => {
        return containerElement.scrollTop + containerElement.clientHeight >= contentElement.clientHeight;
      })
      .startWith(true);

    // When we resize the window, we need to re-enable auto-scroll - if the height changes
    // we will determine that the user scrolled off the bottom, when in fact this is due to the resize event
    this.resizeSub = Observable.fromEvent(window, 'resize')
      .combineLatest(this.isLocked$)
      .subscribe(([event, locked]) => {
        if (locked) {
          this.scrollToBottom();
        }
      });

    this.isHighThroughput$ = stoppableLogStream$
      .timeInterval()
      .sampleTime(500)
      .map(x => {
        const high = x.interval < this.highThroughputTimeMS;
        return high;
      })
      .distinctUntilChanged()
      .startWith(false);

    const buffer$ = Observable.interval()
      .combineLatest(this.isHighThroughput$)
      .throttle(([t, high]) => {
        return Observable.interval(
          high ? this.highThroughputBufferIntervalMS : 0
        );
      });

    const addedLogs$ = stoppableLogStream$
      .buffer(buffer$)
      .filter(log => !!log.length)
      .do(logs => {
        this.logLinesCount += logs.length;
        const elementString = logs
          .map(log => {
            let formatted = this.filter ? this.filter(log) : log;
            formatted = this.colorizer.ansiColorsToHtml(formatted);
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
      });

    this.listeningSub = Observable.combineLatest(this.isLocked$, addedLogs$)
      .do(([isLocked, logs]) => {
        if (isLocked) {
          containerElement.scrollTop = contentElement.clientHeight;
        }
      })
      .subscribe();

    if (this.status) {
      this.statusSub = this.status.subscribe((wsStatus => {
        switch (wsStatus) {
          case 0:
            this.message = 'Connecting....';
            break;
          default:
            this.message = undefined;
            break;
        }
      }));
    }
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
