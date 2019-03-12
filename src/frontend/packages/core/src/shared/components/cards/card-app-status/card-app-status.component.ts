import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../features/applications/application.service';
import { CardStatus } from '../../../shared.types';

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
