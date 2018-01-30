import { ApplicationService } from '../../../../../features/applications/application.service';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-card-app-status',
  templateUrl: './card-app-status.component.html',
  styleUrls: ['./card-app-status.component.scss']
})
export class CardAppStatusComponent implements OnInit {

  constructor(private applicationService: ApplicationService ) { }

  ngOnInit() {}

}
