import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApplicationService } from '../../application.service';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  appService = this.applicationService;

  ngOnInit() {
  }

}
