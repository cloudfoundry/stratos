import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-card-status',
  templateUrl: './card-status.component.html',
  styleUrls: ['./card-status.component.scss']
})
export class CardStatusComponent implements OnInit, OnDestroy {
  sub: Subscription;
  @Input('statusProvider') statusProvider: Observable<any>;

  @Input('status') status: string;

  constructor() { }

  ngOnInit() {
    if (this.statusProvider) {
      this.sub = this.statusProvider.subscribe(status => {
        this.status = status.indicator ? status.indicator : status;
      });
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
