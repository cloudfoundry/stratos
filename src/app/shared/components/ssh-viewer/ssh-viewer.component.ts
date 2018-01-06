import { Component, OnInit, OnDestroy, AfterViewChecked, Input, Output, ViewChild, ElementRef, ViewEncapsulation,
  EventEmitter, HostListener } from '@angular/core';

import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { QueueingSubject } from 'queueing-subject';
import { Subject } from 'rxjs/Subject';

// Import Xterm
import * as Terminal from 'xterm/dist/xterm.js';
import 'xterm/dist/addons/fit/fit.js';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-ssh-viewer',
  templateUrl: './ssh-viewer.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./ssh-viewer.component.scss']
})
export class SshViewerComponent implements OnInit, OnDestroy, AfterViewChecked  {

  @Input('sshStream')
  sshStream: Observable<any>;

  @Input('sshInput')
  sshInput: QueueingSubject<string>;

  @Input('connectionStatus')
  public connectionStatus: Observable<number>;

  @Output('attempting')
  public attempting = new EventEmitter();

  public isConnecting: Observable<boolean>;

  public isConnected = false;
  public attemptingConnection = false;

  @ViewChild('terminal') container: ElementRef;
  private xterm: Terminal;

  private msgSubscription: Subscription;

  private onTermSendData = this.termSendData.bind(this);
  private onTermResize = this.termResize.bind(this);

  constructor() { }

  ngOnInit() {
    this.attempting.emit(false);

    this.isConnecting = this.connectionStatus.pipe(map((count: number) => {

      if (this.attemptingConnection) {
        this.attempting.emit(count === 0);
      } else {
        this.attempting.emit(false);
      }

      this.isConnected = (count !== 0);
      if (this.isConnected) {
        this.xterm.focus();
      }
      return count === 0;
    }));

    this.xterm = new Terminal({
      cols: 80,
      rows: 40
    });
    // console.log(Terminal);
    // Terminal.loadAddon('fit', TerminalFitAddon);

    this.xterm.open(this.container.nativeElement, false);

    // TODO: Fit the terminal when the web socket is connected

    this.xterm.on('data', this.onTermSendData);
    this.xterm.on('resize', this.onTermResize);

    this.reconnect();

  }

  // @HostListener('window:resize', ['$event'])
  onResize(event) {
    console.log('RESIZE !!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(event.target);

    console.log(this.container);
    console.log(this.container.nativeElement.clientWidth);
    console.log(this.container.nativeElement.clientHeight);


  }

  ngAfterViewChecked() {
    this.xterm.fit();
  }

  ngOnDestroy() {
    this.xterm.off('data', this.onTermSendData);
    this.xterm.off('resize', this.onTermResize);
    this.disconnect();
  }

  disconnect() {
    this.attemptingConnection = false;
    this.attempting.emit(false);
    console.log('Disconnect');
    this.msgSubscription.unsubscribe();
    this.isConnected = false;
  }

  reconnect() {
    this.attemptingConnection = true;
    this.attempting.emit(true);
    this.xterm.reset();
    console.log('Reconnect');
    this.msgSubscription = this.sshStream
    .subscribe(
      (data: string) => {
        for (const c of data.split(' ')) {
          this.xterm.write(String.fromCharCode(parseInt(c, 16)));
        }
      },
      (err) => {
        console.log('ERROR');
        this.disconnect();
      },
      () => {
        this.disconnect();
      }
    );
  }

  termSendData(d) {
    if (!this.msgSubscription.closed) {
      this.sshInput.next(JSON.stringify({key: d}));
    }
  }

  termResize(size) {
    if (!this.msgSubscription.closed) {
      this.sshInput.next(JSON.stringify({cols: size.cols, rows: size.rows}));
    }
  }
}
