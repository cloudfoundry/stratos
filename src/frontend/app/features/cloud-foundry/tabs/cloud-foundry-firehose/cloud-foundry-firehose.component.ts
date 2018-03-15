import { OnInit, Component } from '@angular/core';
import * as moment from 'moment';
import { QueueingSubject } from 'queueing-subject/lib';
import websocketConnect from 'rxjs-websockets';
import { Observable } from 'rxjs/Observable';
import { catchError, filter, map, share } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { LogViewerComponent } from '../../../../shared/components/log-viewer/log-viewer.component';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { FireHoseItem, HTTP_METHODS } from './cloud-foundry-firehose.types';
import { CloudFoundryFirehoseFormatter} from './cloud-foundry-firehose-formatter';
import { LoggerService } from '../../../../core/logger.service';

@Component({
  selector: 'app-cloud-foundry-firehose',
  templateUrl: './cloud-foundry-firehose.component.html',
  styleUrls: ['./cloud-foundry-firehose.component.scss']
})
export class CloudFoundryFirehoseComponent implements OnInit {
  messages: Observable<string>;
  connectionStatus: Observable<number>;

  filter;

  formatter;

  constructor(private cfEndpointService: CloudFoundryEndpointService, private logService: LoggerService) {
    this.formatter = new CloudFoundryFirehoseFormatter(logService);
  }

  ngOnInit() {
    const host = window.location.host;
    const streamUrl = `wss://${host}/pp/${environment.proxyAPIVersion}/${
      this.cfEndpointService.cfGuid
      }/firehose`;

    this.setupFirehoseStream(streamUrl);
    this.filter = this.formatter.jsonFilter.bind(this.formatter);
  }

  private setupFirehoseStream(streamUrl: string) {
    const { messages, connectionStatus } = websocketConnect(
      streamUrl,
      new QueueingSubject<string>()
    );

    this.messages = messages;
    this.connectionStatus = connectionStatus;
    messages.pipe(
      catchError(e => {
        return [];
      }),
      share(),
      filter(l => !!l)
      // map(log => {
      //   const fireHoseItem = JSON.parse(log) as FireHoseItem;
      //   const timesString = moment(fireHoseItem.timestamp / 1000000).format(
      //     'hh:mm:ss A'
      //   );
      //   const component = this.getComponent(fireHoseItem);
      //   const message = this.showMessage(fireHoseItem);
      //   return `${timesString}: ${component} ${message}`;
      // })
      );
  }

  private messageFilter(log: string): string {
    const fireHoseItem = JSON.parse(log) as FireHoseItem;
    const timesString = moment(fireHoseItem.timestamp / 1000000).format(
      'hh:mm:ss A'
    );
    const component = this.getComponent(fireHoseItem);
    const message = this.showMessage(fireHoseItem);
    console.log(message);
    return `${timesString}: ${component} ${message}`;
  }

  private getComponent(fireHoseItem: FireHoseItem) {
    return this.stylize(
      `[${fireHoseItem.deployment}/
            ${fireHoseItem.origin}/
            ${fireHoseItem.job}]`,
      fireHoseItem.eventType
    );
  }

  private stylize(text: any, eventType: number, emphasise = false) {
    const str = `${text}`;
    const styles = this.getLogTypeStyles(eventType, emphasise);
    return `<span style="${styles}">${str}</span>`;
  }

  showMessage(fireHoseItem: FireHoseItem) {
    switch (fireHoseItem.eventType) {
      case 4:
        return this.handleAPIEvent(fireHoseItem);
      case 5:
        return this.handleLogEvent(fireHoseItem);
      case 6:
        return this.handleMetric(fireHoseItem);
      case 7:
        return this.handleCounterEvent(fireHoseItem);
      case 8:
        return this.handleErrorEvent(fireHoseItem);
      case 9:
        return this.handleContainerEvent(fireHoseItem);
      default:
        return JSON.stringify(fireHoseItem);
    }
  }

  private handleErrorEvent(fireHoseItem: FireHoseItem) {
    const errorObj = fireHoseItem.error;
    return `ERROR: Source: ${this.stylize(
      errorObj.source,
      8
    )},  Code: ${this.stylize(errorObj.code, 8)},  Message: ${this.stylize(
      errorObj.message,
      8
    )}`;
  }

  private handleAPIEvent(fireHoseItem: FireHoseItem) {
    const httpStartStop = fireHoseItem.httpStartStop;
    const method = HTTP_METHODS[httpStartStop.method - 1];
    const peerType = httpStartStop.peerType === 1 ? 'Client' : 'Server';
    return `${peerType} ${this.stylize(method, 4)} ${
      httpStartStop.uri
      }, Status-Code: ${this.stylize(
        httpStartStop.statusCode,
        5
      )} Content-Length: ${this.stylize(
        httpStartStop.contentLength,
        5
      )} User-Agent:  ${this.stylize(
        httpStartStop.userAgent,
        5
      )} Remote-Address:  ${this.stylize(httpStartStop.remoteAddress, 5)}`;
  }

  private handleMetric(fireHoseItem: FireHoseItem) {
    const valueMetric = fireHoseItem.valueMetric;
    const value = `${valueMetric.value} ${valueMetric.unit}`;
    return `${this.stylize(valueMetric.name, 7, true)}:${this.stylize(
      value,
      5
    )}\n`;
  }

  private handleContainerEvent(fireHoseItem: FireHoseItem) {
    const containerMetric = fireHoseItem.containerMetric;
    const cpuPercentage = `${Math.round(containerMetric.cpuPercentage * 100)}%`;
    return `App: ${containerMetric.applicationId} /${
      containerMetric.instanceIndex
      }
        ${this.stylize('[', 100)}
        ${this.stylize('CPU:', 100, true)}
        ${this.stylize(cpuPercentage, 5, true)},
        ${this.stylize('Memory:', 100, true)},
        ${this.stylize(`${containerMetric.memoryBytes}`, 5, true)},
        ${this.stylize('Disk:', 100, true)},
        ${this.stylize(`${containerMetric.diskBytes}`, 5, true)},
        ${this.stylize(']', 100)}`;
  }

  private handleCounterEvent(fireHoseItem: FireHoseItem) {
    const counterEvent = fireHoseItem.counterEvent;
    const delta = counterEvent.delta;
    const total = counterEvent.total;
    const counterEventString =
      this.stylize(counterEvent.name, 107, true) +
      ': delta = ' +
      this.stylize(`${delta}`, 7, false) +
      ', total = ' +
      this.stylize(`${total}`, 7, false) +
      '\n';
    return counterEventString;
  }

  private handleLogEvent(fireHoseItem: FireHoseItem) {
    const source = this.stylize(
      `[${fireHoseItem.logMessage.source_type}.
          ${fireHoseItem.logMessage.source_instance}]`,
      100
    );
    const message = fireHoseItem.logMessage.message;
    return `${source} ${message}`;
  }

  getLogTypeStyles(eventType: number, emphasise: boolean = false) {
    let makeTextBold = '';
    if (emphasise) {
      makeTextBold = 'font-weight: bold;';
    }
    switch (eventType) {
      case 4:
        // API Event
        return `color:  ${LogViewerComponent.colors.magenta};${makeTextBold}`;
      case 5:
        // Log
        return `color: ${LogViewerComponent.colors.green};${makeTextBold}`;
      case 6:
        // Metric
        return `color: ${LogViewerComponent.colors.blue};${makeTextBold}`;
      case 7:
        // Counter
        return `color: ${LogViewerComponent.colors.purple};${makeTextBold}`;
      case 8:
        // Error
        return `color: ${LogViewerComponent.colors.red};${makeTextBold}`;
      case 9:
      case 100:
        // Container Metric
        return `color: ${LogViewerComponent.colors.teal}$;${makeTextBold}`;

      // Custom Styles
      case 107:
        return `;color:  ${LogViewerComponent.colors.yellow};${makeTextBold}`;
      default:
        return '';
    }
  }
}
