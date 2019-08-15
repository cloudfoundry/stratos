import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { NEVER, Observable, Subject } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, filter, share } from 'rxjs/operators';

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
    if (!this.applicationService.cfGuid || !this.applicationService.appGuid) {
      this.messages = NEVER;
    } else {
      const host = window.location.host;
      const streamUrl = `wss://${host}/pp/v1/${
        this.applicationService.cfGuid
        }/apps/${this.applicationService.appGuid}/stream`;

      const { messages, connectionStatus } = websocketConnect(streamUrl, new Subject<string>());
      messages.pipe(catchError(e => {
        this.logService.error(
          'Error while connecting to socket: ' + JSON.stringify(e)
        );
        return [];
      }),
        share(),
        filter(data => !!data && data.length));

      this.messages = messages;
      this.connectionStatus = connectionStatus;
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
