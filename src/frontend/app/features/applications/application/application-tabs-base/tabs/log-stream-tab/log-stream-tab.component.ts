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

  @ViewChild('searchFilter') searchFilter: NgModel;

  streamTitle$: Observable<string>;

  constructor(
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private logService: LoggerService
  ) {
    this.streamTitle$ = store
      .select(selectEntity(applicationSchemaKey, applicationService.appGuid))
      .filter(app => !!app && !!app.entity)
      .map(app => {
        return `${app.entity.name} log`;
      })
      .first();
  }

  getLogTypeStyles(logItem: LogItem) {
    switch (logItem.message_type) {
      case 1:
        return `color:  ${LogViewerComponent.colors.blue};`;
      case 2:
        return `color: ${LogViewerComponent.colors.red}; font-weight: bold;`;
      case 3:
        return `color:  ${LogViewerComponent.colors.green};`;
      case 4:
        return `color:  ${LogViewerComponent.colors.teal};`;
      case 5:
        return `color:  ${LogViewerComponent.colors.teal};`;
      default:
        return '';
    }
  }

  ngOnInit() {
    if (!this.applicationService.cfGuid || !this.applicationService.appGuid) {
      this.messages = Observable.never();
    } else {
      const host = window.location.host;
      const streamUrl = `wss://${host}/pp/v1/${
        this.applicationService.cfGuid
        }/apps/${this.applicationService.appGuid}/stream`;
      this.messages = websocketConnect(streamUrl, new QueueingSubject<string>())
        .messages.catch(e => {
          this.logService.error(
            'Error while connecting to socket: ' + JSON.stringify(e)
          );
          return [];
        })
        .share()
        .map(message => {
          const json = JSON.parse(message);
          return json;
        })
        .filter(l => !!l)
        .combineLatest(
          this.searchFilter.valueChanges.debounceTime(250).startWith(null)
        )
        .map(([log, value]) => {
          const message = atob(log.message);
          let searchIndex = null;
          if (value) {
            const foundIndex = message
              .toLowerCase()
              .indexOf(value.toLowerCase());
            if (foundIndex >= 0) {
              searchIndex = [foundIndex, foundIndex + value.length];
            } else {
              searchIndex = -1;
            }
          }
          return {
            ...log,
            message,
            searchIndex
          };
        })
        .filter(log => {
          return log.searchIndex !== -1;
        })
        .map(log => {
          let { message } = log;
          const { searchIndex } = log;
          if (searchIndex) {
            const colorStyles = 'color: black; background-color: yellow;';
            const highlight = `<span style="${colorStyles}">${message.slice(
              searchIndex[0],
              searchIndex[1]
            )}</span>`;
            message =
              message.substring(0, searchIndex[0]) +
              highlight +
              message.substring(searchIndex[1]);
          }
          return {
            message,
            log
          };
        })
        .map(({ log, message }) => {
          const styles = this.getLogTypeStyles(log);
          const timesString = moment(
            Math.round(log.timestamp / 1000000)
          ).format('HH:mm:ss.SSS');
          return `[${timesString}]: <span style="${styles}">[${
            log.source_type
            }.${log.source_instance}]</span> ${message}`;
        });
    }
  }
}
