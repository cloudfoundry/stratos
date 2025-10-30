import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomCheckboxComponent } from '../../../../../../core/src/shared/components/custom-checkbox/custom-checkbox.component';
import { Observable, Subject } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, filter, map, share, switchMap } from 'rxjs/operators';

import { UtilsService } from '../../../../../../core/src/core/utils.service';
import { environment } from '../../../../../../core/src/environments/environment.prod';
import { LogViewerComponent } from '../../../../../../core/src/shared/components/log-viewer/log-viewer.component';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryFirehoseFormatter } from './cloud-foundry-firehose-formatter';

@Component({
  selector: 'app-cloud-foundry-firehose',
  templateUrl: './cloud-foundry-firehose.component.html',
  styleUrls: ['./cloud-foundry-firehose.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomCheckboxComponent,
    LogViewerComponent,
  ]
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
