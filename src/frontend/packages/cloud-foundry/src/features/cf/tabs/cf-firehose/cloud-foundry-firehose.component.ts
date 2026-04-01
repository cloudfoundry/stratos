import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { catchError, filter, map, share, switchMap } from 'rxjs/operators';
import websocketConnect from 'rxjs-websockets';

import { CustomCheckboxComponent, LogViewerComponent, UtilsService, environment } from '@stratosui/core';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryFirehoseFormatter } from './cloud-foundry-firehose-formatter';

@Component({
  selector: 'app-cloud-foundry-firehose',
  templateUrl: './cloud-foundry-firehose.component.html',
  styleUrls: ['./cloud-foundry-firehose.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CustomCheckboxComponent,
    LogViewerComponent
]
})
export class CloudFoundryFirehoseComponent implements OnInit {
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private utilsService = inject(UtilsService);

  messages!: Observable<string>;
  connectionStatus!: Observable<number>;

  filter: (jsonString: string) => string;

  // Formatter for fire hose log messages
  formatter!: CloudFoundryFirehoseFormatter;

  ngOnInit() {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const streamUrl = `${protocol}://${host}/pp/${environment.proxyAPIVersion}/${
      this.cfEndpointService.cfGuid
      }/firehose`;

    this.setupFirehoseStream(streamUrl);
    this.formatter = new CloudFoundryFirehoseFormatter(this.utilsService);
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
      catchError((e) => {
        return [] as any;
      }),
      share(),
      filter(l => !!l)
    );
  }
}
