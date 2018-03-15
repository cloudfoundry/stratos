import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Input, Renderer2, ViewEncapsulation } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
import { AnsiColors } from './ansi-colors';

enum STREAMING_STATUS {
  NOT_STREAMING = 0,
  ONLINE = 1,
  CONNECTING = 2,
  CLOSED = 3,
}

// Minimize browser reflow cost by saving old log chunks into
// static divs and only append to a small 'active' div
const logDivCapacity = 8 * 1024;

// Batch up removes from DOM to save reflow costs
const truncateDelayMs = 5000;

// Batch up appends to DOM to save reflow costs
const batchDelayMs = 40;

// Resize divs one by one at an interval
const divResizeIntervalMs = 66; // resizing a single div takes somewhere between 4ms and 10ms

@Component({
  selector: 'app-logstream-viewer',
  templateUrl: './logstream-viewer.component.html',
  styleUrls: ['./logstream-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LogStreamViewerComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input('title') title: string;

  @Input('logStream') logStream: Observable<any>;

  // Custom function to process the log messages
  @Input('filter') filter: Function;

  // Connection status
  @Input('status') status: Observable<number>;

  // logContainer, logTextArea: Access elements directly for better performance with large and fast logs
  // handleScroll, handleWheel: Scroll handler defined in controller needs to be attached by link
  // logContainer;
  logTextArea;
  handleScroll;
  handleWheel;

  // Keep track of the current width of the viewer
  currentWidth = 0;

  // The horizontal padding inside the viewer is measured once during the link phase
  hPadding = 0;

  // colorizer = AnsiColorsService.getInstance();

  logDivId = 0;
  oldestLogDiv = 1;

  // Keep track of the number of bytes held in the viewer
  totalSize = 0;

  capacityBytes = 262144;

  // Prevent wrongly toggling autoScrollOn after non-user scroll events
  automaticScrolled = false;

  // Suspend appends to DOM
  paused = false;

  // Is auto-scroll enabled?
  autoScrollOn = true;

  // Interval that periodically resizes a single log div
  resizeInterval;

  // Keep track of what's left to resize
  divsToResize = [];
  resizedDivsMap = {};

  //
  deferredAppend = false;

  // Is the browser smart?
  smartBrowser = false;

  // Current log contents
  currentLog: any;

  colorize = true;

  @ViewChild('logContainer') logContainerRef: ElementRef;

  logContainer;

  // Streaming status
  streaming: STREAMING_STATUS = STREAMING_STATUS.CLOSED;

  messageSub: Subscription;
  streamingSub: Subscription;
  resizeSub: Subscription;
  visibilitySub: Subscription;
  statusSub: Subscription;

  logMessage$: Observable<boolean>;

  colorizer = new AnsiColors();

  message = 'Connecting ...';
  messageStatus = 1;

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.logContainer = this.logContainerRef.nativeElement;

    console.log(this.logContainer);

    // Resize when window
    // this.resizeSub = Observable.fromEvent(window, 'resize')
    // .debounceTime(200)
    // .subscribe((event) => {
    //   this.getMeasures();
    //   this.resizeAllDivs();
    //   this.paused = false;
    //   if (this.deferredAppend) {
    //     this.append();
    //   }
    // });

    // Refresh when the visibility changes
    this.visibilitySub = Observable.fromEvent(window, 'visibilitychange')
    .subscribe((event: any) => {
      this.paused = true;
      this.resizeAllDivs();
      this.paused = false;
      if (this.deferredAppend) {
        this.append();
      }
    });

    if (this.status) {
      this.statusSub = this.status.subscribe((status => {
        this.messageStatus = status;
        switch (status) {
          default:
            this.message = 'Connecting ...';
            break;
          case 1:
            this.message = 'Connected';
            break;
          case 2:
            this.message = 'Disconnected';
            break;
        }
        console.log('WS Connection stattus...');
        console.log(status);
      }));
    }
  }

  ngOnDestroy() {
    if (this.resizeInterval) {
      clearInterval(this.resizeInterval);
    }
    if (this.streamingSub) {
      this.streamingSub.unsubscribe();
    }

    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
    // this.resizeSub.unsubscribe();
    this.visibilitySub.unsubscribe();

    if (this.statusSub) {
      this.statusSub.unsubscribe();
    }
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngAfterViewInit() {
    this.requestStreamingLog();
  }

  getMeasures() {
    this.hPadding = parseFloat(getComputedStyle(this.logContainer).getPropertyValue('padding-left'));
    this.hPadding += parseFloat(getComputedStyle(this.logContainer).getPropertyValue('padding-right'));
    this.currentWidth = this.logContainer.clientWidth;
  }

  // Handle streaming logs
  requestStreamingLog() {
    this.resetLog();

    console.log('requestStreamingLog');
    console.log(this.logStream);

    if (!this.logStream) {
      return;
    }

    this.streaming = STREAMING_STATUS.ONLINE;

    this.logMessage$ = new Observable<boolean>(observer => {
      this.messageSub = this.logStream.do(message => {
        let logData = message;
        if (this.filter) {
          logData = this.filter(message);
        }

        // Check for logData
        if (!logData || logData.length && logData.length < 1) {
          return;
        }

        let htmlMessage;
        if (this.colorize) {
          htmlMessage = this.colorizer.ansiColorsToHtml(logData);
        } else {
          htmlMessage = logData.replace(/</g, '&lt;'); // Escape embedded markup
        }
        this.currentLog += htmlMessage;
        observer.next(htmlMessage);
      }).subscribe(
        (d) => {
          console.log(d);
        },
        (e) => {
          this.message = 'Disconnected';
          this.messageStatus = 2;
        },
        () => {
          console.log('CLOSED');
          // Ensure on close that we append any outsTanding log messages
          this.append();
          this.messageStatus = 1;
        }
      );
    }).throttleTime(batchDelayMs).map(html => {
      this.append();
      return (this.capacityBytes && this.totalSize > this.capacityBytes);
    }).filter(v => v)
    .throttleTime(truncateDelayMs).do(ok => {
      this.truncateOldDivs();
    });

    this.streamingSub = this.logMessage$.subscribe();
  }

  append() {
    if (this.paused) {
      this.deferredAppend = true;
      return;
    }

    if (!this.currentWidth) {
      this.getMeasures();
    }

    if (!this.logTextArea) {
      this.makeLogDiv();
    }
    this.deferredAppend = false;
    this.logTextArea.innerHTML = this.currentLog;
    this.rollNextLogDiv();
    this.autoScroll();
  }

  autoScroll() {
    if (this.autoScrollOn) {
      this.setScrollTop(this.logContainer.scrollHeight - this.logContainer.clientHeight);
    }
  }

  setScrollTop(newScrollTop) {
    if (this.logContainer.scrollTop !== newScrollTop) {
      this.automaticScrolled = true;
      this.logContainer.scrollTop = newScrollTop;
    }
  }

  // When the current log div is full, append a new one
  rollNextLogDiv() {
    const currentDivSize = this.logTextArea.innerHTML.length;
    if (currentDivSize > logDivCapacity) {
      this.totalSize += currentDivSize;
      this.makeLogDiv();
    }
  }

  enableAutoScroll() {
    this.autoScrollOn = true;
    this.autoScroll();
  }

  makeLogDiv() {
    this.logDivId++;
    // const a = this.logContainer.insertAdjacentHTML(
    //   'beforeEnd',
    //   '<div id="logDiv-' + this.logDivId + '" style="width: ' + this.currentWidth + 'px;"></div>'
    // );
    // this.logTextArea = document.getElementById('logDiv-' + this.logDivId);
    // console.log(test);
    // console.log(a);

    const el = this.renderer.createElement('div');
    this.renderer.setAttribute(el, 'id', 'logDiv-' + this.logDivId);
    // if (this.currentWidth) {
    //   this.renderer.setStyle(el, 'width', this.currentWidth + 'px');
    // }
    this.renderer.appendChild(this.logContainer, el);
    this.logTextArea = el;
    this.currentLog = '';
  }

  truncateOldDivs() {
    if (!this.capacityBytes) {
      return;
    }

    // Remember scrollTop and scrollHeight before truncation
    let oldScrollTop, preHeight;
    if (!this.autoScrollOn) {
      oldScrollTop = this.logContainer.scrollTop;
      preHeight = this.logContainer.scrollHeight;
    }

    // Truncate to reclaim 3 divs worth of spare capacity
    while (this.totalSize > this.capacityBytes - 3 * logDivCapacity) {
      // Keep at least 2 divs to avoid blanking the log
      if (this.oldestLogDiv >= this.logDivId - 2) {
        break;
      }

      const oldDiv = document.getElementById('logDiv-' + this.oldestLogDiv);
      if (!oldDiv) {
        // Shouldn't happen
        break;
      }
      this.oldestLogDiv++;
      this.totalSize -= oldDiv.innerHTML.length;
      oldDiv.remove();
    }

    // If not auto-scrolling, maintain the visible portion of the log
    if (!this.autoScrollOn && oldScrollTop > 0) {
      const delta = preHeight - this.logContainer.scrollHeight;
      let newScrollTop = oldScrollTop - delta;
      if (newScrollTop < 0) {
        newScrollTop = 0;
      }
      this.setScrollTop(newScrollTop);
    }

    // Truncating the log can create an automatic scroll event, skip this in our scroll handler
    this.automaticScrolled = true;
  }

  resetLog() {
    // Clear the log container
    if (!this.logContainer) {
      return;
    }
    this.logContainer.innerHTML = '';
    this.logDivId = 0;
    this.oldestLogDiv = 1;
    this.totalSize = 0;
    this.automaticScrolled = false;
    // this.makeLogDiv();
  }

  // Detect user (manual) scroll
  onScroll() {
    if (this.automaticScrolled) {
      // Save on reflow cycles if scroll was automatic
      this.automaticScrolled = false;
    } else {
      // Resize div in view if needed
      if (this.resizeInterval) {
        this.resizeInView();
      }
      // Update auto scroll
      this.updateAutoScroll();
    }
    return false;
  }

  // Trap wheel events in the log-viewer (only used in Webkit)
  wheelHandler(event) {
    const delta = event.wheelDelta; // Ok as only needed in Chrome
    if (delta > 0 && this.logContainer.scrollTop === 0) {
      event.preventDefault();
    } else if (delta < 0 && this.logContainer.scrollTop + 1 >= this.logContainer.scrollHeight - this.logContainer.clientHeight) {
      event.preventDefault();
    }
  }

  updateAutoScroll() {
    // We need to allow 1px for flex layout pixel rounding
    this.autoScrollOn = this.logContainer.scrollTop + 1 >= this.logContainer.scrollHeight - this.logContainer.clientHeight;
  }

  resizeInView() {
    const inView = this.getFirstDivInView();
    if (!this.resizedDivsMap[inView]) {
      // Immediately resize
      this.resizeSingleDiv(inView, this.currentWidth);
    }
  }

  // Resizing
  resizeSingleDiv(divId, widthPx) {
    this.resizedDivsMap[divId] = true;
    const index = this.divsToResize.indexOf(divId);
    if (index > -1) {
      this.divsToResize.splice(index, 1);
    }
    const aDiv = document.getElementById('logDiv-' + divId);
    if (!aDiv) {
      return;
    }

    const previousHeight = aDiv.offsetHeight;
    const prevScrollTop = this.logContainer.scrollTop;
    const scrollAffected = !this.smartBrowser && !this.autoScrollOn && prevScrollTop > aDiv.offsetTop;

    aDiv.style.width = widthPx;

    // Adjust scroll: best effort to maintain viewer's context
    if (scrollAffected) {
      const newHeight = aDiv.offsetHeight;
      if (newHeight !== previousHeight) {
        // Check if Chrome 56+ has kindly done the adjustment for us
        if (prevScrollTop === this.logContainer.scrollTop) {
          this.logContainer.scrollTop += newHeight - previousHeight;
        } else {
          this.smartBrowser = true;
        }
      }
    }

    // If we're auto-scrolling, ensure we stick to the bottom
    this.autoScroll();
  }

  resizeAllDivs() {
    this.resizedDivsMap = {};
    this.divsToResize = [];

    // Work out which div is currently shown
    let shownDiv;
    if (!this.autoScrollOn) {
      const inView = this.getFirstDivInView();
      if (inView === null) {
        shownDiv = this.logDivId;
      } else {
        shownDiv = inView;
      }
    } else {
      shownDiv = this.logDivId;
    }

    this.divsToResize.push(shownDiv);

    // Resize all divs starting from the first in-view and outwards in both directions
    let upwards = shownDiv;
    let downwards = shownDiv;
    while (downwards < this.logDivId || upwards > this.oldestLogDiv) {
      if (upwards > this.oldestLogDiv) {
        this.divsToResize.push(--upwards);
      }
      if (downwards < this.logDivId) {
        this.divsToResize.push(++downwards);
      }
    }

    // Synchronously resize the shown div and its immediate neighbours
    const widthPx = this.currentWidth + 'px';
    for (let i = 0; i < 3; i++) {
      this. resizeSingleDiv(this.divsToResize[0], widthPx);
    }

    // Asynchronously resize the rest
    if (this.resizeInterval) {
      clearInterval(this.resizeInterval);
    }

    this.resizeInterval = setInterval(() => {
      this.resizeSingleDiv(this.divsToResize[0], widthPx);
      if (this.divsToResize.length < 1) {
        clearInterval(this.resizeInterval);
        this.resizeInterval = undefined;
      }
    }, divResizeIntervalMs);
  }

  getFirstDivInView() {
    // Note: we know that divs are stacked vertically so some optimizations are possible
    const viewerTop = this.logContainer.scrollTop;
    const viewerBottom = viewerTop + this.logContainer.offsetHeight;

    for (let divId = this.oldestLogDiv; divId <= this.logDivId; divId++) {
      const aDiv = document.getElementById('logDiv-' + divId);
      if (!aDiv) {
        // Shouldn't happen
        continue;
      }
      const divTop = aDiv.offsetTop;
      if (divTop > viewerBottom) {
        // Subsequent divs cannot be in view since we're already beyond the bottom of the viewer
        return null;
      }
      const divBottom = divTop + aDiv.offsetHeight;
      if (divBottom < viewerTop) {
        continue;
      }
      // Div is in view
      return divId;
    }
    return null;
  }
}
