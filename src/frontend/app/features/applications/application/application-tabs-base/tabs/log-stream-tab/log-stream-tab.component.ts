import {
  getEntityById,
  selectEntity
} from '../../../../../../store/selectors/api.selectors';
import { State, Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { LogViewerComponent } from '../../../../../../shared/components/log-viewer/log-viewer.component';
import { ApplicationService } from '../../../../application.service';
import { NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Rx';
import { Component, OnInit, ViewChild } from '@angular/core';
import { QueueingSubject } from 'queueing-subject';
import websocketConnect from 'rxjs-websockets';
import { MatInput } from '@angular/material';
import * as moment from 'moment';
import { LoggerService } from '../../../../../../core/logger.service';
import { applicationSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { AnsiColorizer} from '../../../../../../shared/components/log-viewer/ansi-colorizer';

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

  filter;

  private colorizer = new AnsiColorizer();

  constructor(
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private logService: LoggerService
  ) {
    this.filter = this.jsonFilter.bind(this);
  }

  ngOnInit() {
    if (!this.applicationService.cfGuid || !this.applicationService.appGuid) {
      this.messages = Observable.never();
    } else {
      const host = window.location.host;
      const streamUrl = `wss://${host}/pp/v1/${
        this.applicationService.cfGuid
        }/apps/${this.applicationService.appGuid}/stream`;

      const { messages, connectionStatus } = websocketConnect(streamUrl, new QueueingSubject<string>());
      messages.catch(e => {
        this.logService.error(
          'Error while connecting to socket: ' + JSON.stringify(e)
        );
        return [];
      })
      .share()
      .filter(data => !!data && data.length);

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

      let msgColour, sourceColour, bold;

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
