import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ServicesService } from '../services.service';

@Component({
  selector: 'app-service-summary',
  templateUrl: './service-summary.component.html',
  styleUrls: ['./service-summary.component.scss']
})
export class ServiceSummaryComponent implements OnInit {

  constructor(

  ) { }

  ngOnInit() {
  }

}
