import { throttle } from 'rxjs/operator/throttle';
import { Element } from '@angular/compiler';
import { ApplicationService } from '../../../features/applications/application.service';
import { Observable, Subscription, BehaviorSubject } from 'rxjs/Rx';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatButton } from '@angular/material';
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

  currentLog = '';

  logLinesCount = 0;

  maxLogLines = 1000;

  highThroughputTimeMS = 300; // If the time interval between log emits is less then we're in high throughput mode
  highThroughputBufferIntervalMS = 100; // Buffer time for high through mode

  countAttribute = 'batchLength';
  estimatedCount = 0;

  listeningSub: Subscription;
  statusSub: Subscription;
  resizeSub: Subscription;

  stopped$: BehaviorSubject<boolean>;
  isLocked$: Observable<boolean>;
  isHighThroughput$: Observable<boolean>;

  colorizer = new AnsiColors();

  message: string;

  ngOnInit() {
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
    // we will determine that the user scrolled off the bottom, when in fact this si due to the resize event
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

  scrollToBottom() {
    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;
    containerElement.scrollTop = contentElement.clientHeight;
  }

  pause(pause) {
    this.stopped$.next(pause);
  }

  binElement() {
    const toRemove = this.content.nativeElement.firstChild;
    if (!toRemove) {
      return null;
    }
    const removedEle = this.content.nativeElement.removeChild(toRemove);
    this.logLinesCount -= removedEle.getAttribute(this.countAttribute) || 1;
    return removedEle;
  }

  ngOnDestroy(): void {
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
}
