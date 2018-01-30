import { Component, OnInit } from '@angular/core';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss'],
  providers: [CfOrgSpaceDataService],
})
export class CreateApplicationComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
}
