import { throttle } from 'rxjs/operator/throttle';
import { Element } from '@angular/compiler';
import { ApplicationService } from '../../../features/applications/application.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MdButton } from '@angular/material';


@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})

export class LogViewerComponent implements OnInit, OnDestroy {

  static colors = {
    red: '#CC6666',
    green: '#B5BD68',
    yellow: '#F0C674',
    blue: '#81A2BE',
    purple: '#B294BB',
    teal: '#8ABEB7',
    grey: '#C5C8C6'
  };

  @Input('title')
  title: string;

  @Input('logStream')
  logStream: Observable<any>;

  @ViewChild('container')
  container: ElementRef;

  @ViewChild('bin')
  bin: ElementRef;

  @ViewChild('content')
  content: ElementRef;

  @ViewChild('pauseButton')
  pauseButton: MdButton;

  @ViewChild('followLogButton')
  followLogButton: MdButton;

  currentLog = '';

  logLinesCount = 0;

  maxLogLines = 1000;

  stickToBottom = true;

  highThroughput = false;
  highThroughputTimeMS = 100; // If the time interval between log emits is less then we're in high throughput mode
  highThroughputBufferIntervalMS = 100; // Buffer time for high through mode

  countAttribute = 'batchLength';
  estimatedCount = 0;

  removalSub: Subscription;
  listeningSub: Subscription;

  stopped$: Observable<boolean>;
  isLocked$: Observable<boolean>;
  isHightThroughput$: Observable<boolean>;

  ngOnInit() {

    const contentElement = this.content.nativeElement;
    const containerElement = this.container.nativeElement;

    this.stopped$ = Observable
      .fromEvent<boolean>(this.pauseButton._elementRef.nativeElement, 'click')
      .scan((acc, x) => {
        return !acc;
      }, false)
      .startWith(false);

    const stoppableLogStream$ = this.stopped$
      .switchMap(stopped => stopped ? Observable.never() : this.logStream);

    this.isLocked$ =
      Observable.fromEvent<MouseEvent>(this.followLogButton._elementRef.nativeElement, 'click')
        .scan((acc, event) => !acc, true)
        .startWith(true);

    this.isHightThroughput$ = stoppableLogStream$
      .timeInterval()
      .sampleTime(1000)
      .map(x => {
        const high = x.interval < this.highThroughputTimeMS;
        return high;
      })
      .distinctUntilChanged();

    const buffer$ = Observable.interval(100)
      .combineLatest(this.isHightThroughput$)
      .throttle(([t, high]) => {
        return Observable.interval(high ? this.highThroughputBufferIntervalMS : 0);
      })
      .debounceTime(this.highThroughputBufferIntervalMS);

    const addedLogs$ = stoppableLogStream$
      .buffer(buffer$)
      .filter(log => !!log.length)
      .do((logs) => {
        this.logLinesCount += logs.length;
        const elementString = logs.map(log => {
          return `<div style="padding: 5px 0; color: #C5C8C6;">${log}</div>`;
        }).join('');
        const ele = document.createElement('div') as HTMLDivElement;
        if (logs.length > 1) {
          ele.setAttribute(this.countAttribute, '' + logs.length);
        }
        ele.innerHTML = elementString;
        contentElement.append(ele);
        if (this.logLinesCount > this.maxLogLines) {
          this.binElement();
        }
      });

    this.listeningSub = Observable.combineLatest(
      this.isLocked$,
      addedLogs$
    ).do(([isLocked, logs]) => {
      if (isLocked) {
        containerElement.scrollTop = contentElement.clientHeight;
      }
    }).subscribe();

    this.removalSub = Observable.interval(5000).do(() => {
      this.remove();
    }).subscribe();
  }

  binElement() {
    try {
      const removedEle = this.content.nativeElement.removeChild(this.content.nativeElement.firstChild);
      this.bin.nativeElement.append(removedEle);
      this.logLinesCount -= (removedEle.getAttribute(this.countAttribute) || 1);
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
