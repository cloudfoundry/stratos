import { ApplicationService } from '../../../../features/applications/application.service';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { CardStatus } from '../../application-state/application-state.service';

@Component({
  selector: 'app-card-app-status',
  templateUrl: './card-app-status.component.html',
  styleUrls: ['./card-app-status.component.scss']
})
export class CardAppStatusComponent implements OnInit {
  status$: Observable<CardStatus>;
  constructor(public applicationService: ApplicationService) { }

  ngOnInit() {
    this.status$ = this.applicationService.applicationState$.pipe(
      map(state => state.indicator)
    );
  }

}
