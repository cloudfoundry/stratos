import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, filter, share } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { LoggerService } from '../../../../core/logger.service';
import { UtilsService } from '../../../../core/utils.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryFirehoseFormatter } from './cloud-foundry-firehose-formatter';

@Component({
  selector: 'app-cloud-foundry-firehose',
  templateUrl: './cloud-foundry-firehose.component.html',
  styleUrls: ['./cloud-foundry-firehose.component.scss']
})
export class CloudFoundryFirehoseComponent implements OnInit {
  messages: Observable<string>;
  connectionStatus: Observable<number>;

  filter: Function;

  // Formatter for fire hose log messages
  formatter: CloudFoundryFirehoseFormatter;

  constructor(
    private cfEndpointService: CloudFoundryEndpointService,
    private logService: LoggerService,
    private utilsService: UtilsService
  ) { }

  ngOnInit() {
    const host = window.location.host;
    const streamUrl = `wss://${host}/pp/${environment.proxyAPIVersion}/${
      this.cfEndpointService.cfGuid
      }/firehose`;

    this.setupFirehoseStream(streamUrl);
    this.formatter = new CloudFoundryFirehoseFormatter(this.logService, this.utilsService);
    this.filter = this.formatter.jsonFilter.bind(this.formatter);
  }

  private setupFirehoseStream(streamUrl: string) {
    const { messages, connectionStatus } = websocketConnect(
      streamUrl,
      new Subject<string>()
    );

    this.messages = messages;
    this.connectionStatus = connectionStatus;
    messages.pipe(
      catchError(e => {
        return [];
      }),
      share(),
      filter(l => !!l)
    );
  }
}
