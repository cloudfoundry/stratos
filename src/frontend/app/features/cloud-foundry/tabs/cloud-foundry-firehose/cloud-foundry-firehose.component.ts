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
import { UtilsService } from '../../../../core/utils.service';

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
  ) {
    this.formatter = new CloudFoundryFirehoseFormatter(logService, utilsService);
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
    );
  }
}
