import { Component, OnInit, Input } from '@angular/core';
import { ApplicationMonitorService } from '../../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-card-app-usage',
  templateUrl: './card-app-usage.component.html',
  styleUrls: ['./card-app-usage.component.scss']
})
export class CardAppUsageComponent implements OnInit {

  constructor(private appService: ApplicationService, private appMonitor: ApplicationMonitorService) { }

  appData$: Observable<any>;

  ngOnInit() {
    this.appData$ = Observable.combineLatest(
      this.appMonitor.appMonitor$,
      this.appService.application$.map(data => data.app.entity.state === 'STARTED'),
      (monitor, isRunning) => ({ monitor: monitor, isRunning: isRunning, status: !isRunning ? 'tentative' : monitor.status.usage})
    );

    this.appData$.subscribe(row => console.log(row));
  }

}


