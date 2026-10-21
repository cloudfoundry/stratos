import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';

import { NgModel } from '@angular/forms';
import { format } from 'date-fns';
import { BehaviorSubject, EMPTY, NEVER, Observable, Subject, timer } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, debounceTime, map, retry, share, switchMap, tap } from 'rxjs/operators';

import { AnsiColorizer, LogViewerComponent } from '@stratosui/core';
import { ApplicationService } from '../../../../application.service';


export interface LogItem {
  message: string;
  message_type: number;
  app_id: string;
  source_type: string;
  source_instance: string;
  timestamp: number;
}

interface ConnectionError {
  message: string;
  retryable: boolean;
  timestamp: number;
}
@Component({
  selector: 'app-log-stream-tab',
  templateUrl: './log-stream-tab.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0 w-full' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LogViewerComponent
]
})
export class LogStreamTabComponent implements OnInit, OnDestroy {
  private applicationService = inject(ApplicationService);
  private cdr = inject(ChangeDetectorRef);

  public messages!: Observable<string>;
  // 0 connecting, 1 connected, -2 retrying, -1 failed: the codes the log
  // viewer turns into its status message.
  private connectionStatusSubject = new BehaviorSubject<number>(0);
  public connectionStatus: Observable<number> = this.connectionStatusSubject.pipe(
    // Ensure the connection message doesn't flash onscreen.
    debounceTime(250)
  );
  private socketError = false;
  protected readonly maxRetries = 3;
  private retryDelayMs = 2000;
  private lastError: ConnectionError | null = null;

  // strict: populated by Angular's @ViewChild query after view init.
  @ViewChild('searchFilter', { static: false }) searchFilter!: NgModel;

  filter;

  private colorizer = new AnsiColorizer();

  constructor() {
    this.filter = this.jsonFilter.bind(this);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.connectionStatusSubject.complete();
  }

  ngOnInit() {
    if (!this.applicationService.cfGuid || !this.applicationService.appGuid) {
      this.messages = NEVER;
      this.lastError = {
        message: 'Invalid configuration: Missing application or Cloud Foundry endpoint information',
        retryable: false,
        timestamp: Date.now()
      };
      this.connectionStatusSubject.next(-1); // Indicate invalid configuration
      this.cdr.markForCheck();
    } else {
      // Use window.location.protocol to construct proper WebSocket URL
      // This ensures we use the correct protocol (ws/wss) based on page protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const streamUrl = `${protocol}//${host}/pp/v1/${
        this.applicationService.cfGuid
        }/apps/${this.applicationService.appGuid}/stream`;

      console.log('WebSocket connection URL:', streamUrl);

      const socket$ = makeWebSocketObservable<string>(streamUrl).pipe(
        tap(() => {
          // Reset error state on successful connection
          this.socketError = false;
          this.lastError = null;
          this.connectionStatusSubject.next(1);
          console.log('WebSocket connected successfully');
          this.cdr.markForCheck();
        }),
        // maxRetries attempts in all: the first connection and maxRetries - 1
        // retries. A successful connection starts the count again.
        retry({
          count: this.maxRetries - 1,
          resetOnSuccess: true,
          delay: (error, retryCount) => {
            const errorMessage = this.parseWebSocketError(error);
            console.warn(`WebSocket connection attempt ${retryCount} failed:`, errorMessage);
            this.lastError = {
              message: errorMessage,
              retryable: true,
              timestamp: Date.now()
            };
            // Inform user of retry attempt
            this.connectionStatusSubject.next(-2); // -2 indicates retrying
            this.cdr.markForCheck();
            // Exponential backoff: 2s, then 4s
            const delay = this.retryDelayMs * Math.pow(2, retryCount - 1);
            console.log(`Retrying WebSocket connection in ${delay}ms...`);
            return timer(delay);
          },
        }),
        catchError(e => {
          const errorMessage = this.parseWebSocketError(e);
          console.error(
            `WebSocket connection failed after ${this.maxRetries} attempts. Reason: ${errorMessage}`
          );
          this.socketError = true;
          this.lastError = {
            message: errorMessage,
            retryable: false,
            timestamp: Date.now()
          };
          this.connectionStatusSubject.next(-1);
          this.cdr.markForCheck();
          // Return EMPTY to complete the stream gracefully
          return EMPTY;
        }),
        share(),
      );

      this.messages = socket$.pipe(
        switchMap((getResponses: GetWebSocketResponses<string> | null) => {
          if (!getResponses) {
            console.warn('WebSocket getResponses is null');
            return EMPTY;
          }
          return getResponses(new Subject<string>());
        }),
        map((message: string) => message),
        catchError(error => {
          const errorMessage = error?.message || 'Unknown message stream error';
          console.error('Error in message stream:', errorMessage);
          this.lastError = {
            message: `Message stream error: ${errorMessage}`,
            retryable: false,
            timestamp: Date.now()
          };
          this.connectionStatusSubject.next(-1);
          this.cdr.markForCheck();
          return EMPTY;
        }),
        tap(() => {
          // Mark for check on each message for real-time streaming
          this.cdr.markForCheck();
        })
      );
    }
  }

  /**
   * Parse WebSocket error to provide user-friendly error messages
   */
  private parseWebSocketError(error: any): string {
    if (!error) {
      return 'Unknown connection error';
    }

    // Check for common error patterns
    if (error.type === 'error' && error.target instanceof WebSocket) {
      const readyState = error.target.readyState;

      switch (readyState) {
        case WebSocket.CONNECTING:
          return 'Connection attempt in progress';
        case WebSocket.CLOSED:
          return 'Backend service unavailable. Please ensure the Jetstream backend is running.';
        case WebSocket.CLOSING:
          return 'Connection is closing';
        default:
          return 'WebSocket connection failed - backend may be unavailable';
      }
    }

    // SSL/Certificate errors
    if (error.message?.includes('certificate') || error.message?.includes('SSL')) {
      return 'SSL certificate error. Please accept the self-signed certificate for local development.';
    }

    // Network errors
    if (error.message?.includes('NetworkError') || error.message?.includes('network')) {
      return 'Network error - unable to reach backend service';
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return 'Connection timeout - backend service not responding';
    }

    // Default to error message or generic message
    return error.message || error.toString() || 'WebSocket connection failed';
  }

  jsonFilter(jsonString: string) {
    try {
      const messageObj = JSON.parse(jsonString);
      if (!messageObj) {
        return;
      }

      // Defaults preserve the legacy behavior: an empty colour string and
      // bold=false take colorize's no-style branch just as undefined did.
      let msgColour = '';
      let sourceColour: string;
      let bold = false;

      // CF timestamps are in nanoseconds
      const msStamp = Math.round(messageObj.timestamp / 1000000);
      const timeStamp = format(new Date(msStamp), 'HH:mm:ss.SSS');

      if (/APP/.test(messageObj.source_type)) {
        sourceColour = 'green';
      } else {
        sourceColour = 'yellow';
      }
      const messageSource =
        this.colorizer.colorize('[' + messageObj.source_type + '.' + messageObj.source_instance + ']', sourceColour, true);

      if (messageObj.message_type === 2) {
        msgColour = 'red';
        bold = true;
      }
      const messageString = this.colorizer.colorize(decodeURIComponent(escape(atob(messageObj.message))), msgColour, bold) + '\n';
      return timeStamp + ': ' + messageSource + ' ' + messageString;
    } catch (error) {
      console.error('Failed to filter jsonMessage from WebSocket: ' + JSON.stringify(error));
      return jsonString;
    }
  }
}
