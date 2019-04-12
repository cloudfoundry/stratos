import { Component, OnInit } from '@angular/core';
import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-events-page',
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.scss']
})
export class EventsPageComponent {
  public events$: Observable<IGlobalEvent[]>;

  constructor(
    eventService: GlobalEventService
  ) {
    this.events$ = eventService.events$;
  }
}
