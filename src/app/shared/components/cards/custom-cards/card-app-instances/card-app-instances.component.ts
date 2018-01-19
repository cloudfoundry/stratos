import { ApplicationService } from '../../../../../features/applications/application.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-app-instances',
  templateUrl: './card-app-instances.component.html',
  styleUrls: ['./card-app-instances.component.scss']
})
export class CardAppInstancesComponent implements OnInit {
  appInstanceState$: any;

  constructor(private applicationService: ApplicationService ) { }

  ngOnInit() {}

}
