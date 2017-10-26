import { Observable } from 'rxjs/Rx';
import { Component, OnInit } from '@angular/core';
import { QueueingSubject } from 'queueing-subject';
import websocketConnect from 'rxjs-websockets';

@Component({
  selector: 'app-log-stream-tab',
  templateUrl: './log-stream-tab.component.html',
  styleUrls: ['./log-stream-tab.component.scss']
})
export class LogStreamTabComponent implements OnInit {

  public messages: Observable<string>;

  constructor() { }
  //wss://stratos-ui.ngrok.io/pp/v1/663a363e-1faf-4359-ac96-b8c24ec1a4ab/firehose
  ngOnInit() {
    this.messages = websocketConnect(
      'wss://localhost:4200/pp/v1/663a363e-1faf-4359-ac96-b8c24ec1a4ab/firehose',
      new QueueingSubject<string>()
    ).messages.share();
  }

}
