import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, filter, map, share, switchMap } from 'rxjs/operators';

import { UtilsService } from '../../../../../../core/src/core/utils.service';
import { environment } from '../../../../../../core/src/environments/environment.prod';
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

  filter: (jsonString: string) => string;

  // Formatter for fire hose log messages
  formatter: CloudFoundryFirehoseFormatter;

  constructor(
    private cfEndpointService: CloudFoundryEndpointService,
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
    this.messages = websocketConnect(
      streamUrl
    ).pipe(
      switchMap((get) => get(new Subject<string>())),
      map((message: string) => message)
    );
    this.messages.pipe(
      catchError(e => {
        return [];
      }),
      share(),
      filter(l => !!l)
    );
  }
}
