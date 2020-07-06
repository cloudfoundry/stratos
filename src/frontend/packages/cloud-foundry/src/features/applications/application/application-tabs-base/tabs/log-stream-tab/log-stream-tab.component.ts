import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { NEVER, Observable, Subject } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, share, switchMap, map, first, startWith, debounceTime } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { LoggerService } from '../../../../../../../../core/src/core/logger.service';
import { AnsiColorizer } from '../../../../../../../../core/src/shared/components/log-viewer/ansi-colorizer';
import { ApplicationService } from '../../../../application.service';


export interface LogItem {
  message: string;
  message_type: number;
  app_id: string;
  source_type: string;
  source_instance: string;
  timestamp: number;
}
@Component({
  selector: 'app-log-stream-tab',
  templateUrl: './log-stream-tab.component.html',
  styleUrls: ['./log-stream-tab.component.scss']
})
export class LogStreamTabComponent implements OnInit {
  public messages: Observable<string>;
  private connectionStatusSubject = new Subject<number>();
  public connectionStatus: Observable<number>;

  @ViewChild('searchFilter') searchFilter: NgModel;

  filter;

  private colorizer = new AnsiColorizer();

  constructor(
    private applicationService: ApplicationService,
    private store: Store<CFAppState>,
    private logService: LoggerService
  ) {
    this.filter = this.jsonFilter.bind(this);
  }

  ngOnInit() {
    this.connectionStatusSubject.next(0);
    if (!this.applicationService.cfGuid || !this.applicationService.appGuid) {
      this.messages = NEVER;
    } else {
      const host = window.location.host;
      const streamUrl = `wss://${host}/pp/v1/${
        this.applicationService.cfGuid
        }/apps/${this.applicationService.appGuid}/stream`;

      const socket$ = makeWebSocketObservable(streamUrl).pipe(catchError(e => {
        this.logService.error(
          'Error while connecting to socket: ' + JSON.stringify(e)
        );
        return [];
      }),
        share(),
      );

      this.messages = socket$.pipe(
        switchMap((getResponses: GetWebSocketResponses) => {
          return getResponses(new Subject<string>());
        }),
        map((message: string) => message),
      );

      this.connectionStatus = socket$.pipe(
        first(),
        map(() => 1),
        startWith(0),
        // Ensure the connection message doesn't flash onscreen.
        debounceTime(250)
      );
    }
  }

  jsonFilter(jsonString) {
    try {
      const messageObj = JSON.parse(jsonString);
      if (!messageObj) {
        return;
      }

      let msgColour;
      let sourceColour;
      let bold;

      // CF timestamps are in nanoseconds
      const msStamp = Math.round(messageObj.timestamp / 1000000);
      const timeStamp = moment(msStamp).format('HH:mm:ss.SSS');

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
      const messageString = this.colorizer.colorize(atob(messageObj.message), msgColour, bold) + '\n';
      return timeStamp + ': ' + messageSource + ' ' + messageString;
    } catch (error) {
      this.logService.error('Failed to filter jsonMessage from WebSocket: ' + JSON.stringify(error));
      return jsonString;
    }
  }
}
