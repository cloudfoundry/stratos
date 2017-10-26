import { throttle } from 'rxjs/operator/throttle';
import { Element } from '@angular/compiler';
import { ApplicationService } from '../../../features/applications/application.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';


interface LogItem {
  message: string;
  message_type: number;
  app_id: string;
  source_type: string;
  source_instance: string;
  timestamp: string;
}

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})
export class LogViewerComponent implements OnInit, OnDestroy {

  @Input('logStream')
  logStream: Observable<any>;

  @ViewChild('container')
  container: ElementRef;

  @ViewChild('bin')
  bin: ElementRef;

  @ViewChild('content')
  content: ElementRef;

  @ViewChild('pauseButton')
  pauseButton: ElementRef;

  STREAMING_STATUS = {
    NOT_STREAMING: 0,
    ONLINE: 1,
    CONNECTING: 2,
    CLOSED: 3
  };

  // colorizer = AnsiColorsService.getInstance();

  smartBrowser = false;

  capacityBytes = 0;

  currentLog = '';

  logLinesCount = 0;

  maxLogLines = 1000;

  stickToBottom = true;

  highThroughput = false;
  highThroughputTimeMS = 500; // If the time interval between log emits is less then we're in high throughput mode
  highThroughputBufferIntervalMS = 200; // Buffer time for high through mode

  bufferTime = 0;

  reuseElement = null;

  batchCounts = [];

  countAttribute = 'batchLength';
  estimatedCount = 0;

  removalSub: Subscription;
  listeningSub: Subscription;

  ngOnInit() {

    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;

    const isPaused$ = Observable
      .fromEvent(this.pauseButton.nativeElement, 'click')
      .scan((acc, x) => {
        return !acc;
      }, false)
      .startWith(false);

    const isLocked$ = Observable
      .fromEvent(containerElement, 'scroll')
      .map(() => {
        return false;
      })
      .distinctUntilChanged()
      .startWith(true);

    const isHightThroughput$ = this.logStream
      .timeInterval()
      .throttleTime(1000)
      .map(x => {
        const high = x.interval < this.highThroughputTimeMS;
        return high;
      });

    const buffer$ = Observable.interval(100)
      .combineLatest(isHightThroughput$)
      .throttle(([t, high]) => {
        return Observable.interval(high ? this.highThroughputBufferIntervalMS : 0);
      })
      .debounceTime(this.highThroughputBufferIntervalMS);

    this.removalSub = Observable.interval(5000).do(() => {
      this.remove();
    }).subscribe();

    this.listeningSub = isPaused$
      .switchMap(paused => paused ? Observable.never() : this.logStream)
      .buffer(buffer$)
      .combineLatest(isLocked$)
      .do(([logs, isLocked]) => {
        this.logLinesCount += logs.length;
        const elementString = logs.map(log => {
          const timestamp = JSON.parse(log);
          return `<div class="log-line">${timestamp.timestamp}</div>`;
        }).join('');
        const ele = document.createElement('div') as HTMLDivElement;
        if (logs.length > 1) {
          ele.setAttribute(this.countAttribute, '' + logs.length);
        }
        ele.innerHTML = elementString;
        contentElement.append(ele);
        console.log(isLocked);
        if (isLocked) {
          containerElement.scrollTop = contentElement.clientHeight;
        }
        if (this.logLinesCount > this.maxLogLines) {
          this.binElement();
        }
      })
      .subscribe();
  }

  binElement() {
    try {
      const removedEle = this.content.nativeElement.removeChild(this.content.nativeElement.lastChild);
      this.bin.nativeElement.append(removedEle);
      this.logLinesCount -= (removedEle.getAttribute(this.batchCounts) || 1);
    } catch (e) { }
  }

  remove() {
    const binHeight = this.bin.nativeElement.clientHeight;
    this.bin.nativeElement.innerHTML = '';
  }

  ngOnDestroy(): void {
    this.removalSub.unsubscribe();
    this.listeningSub.unsubscribe();
  }

}
