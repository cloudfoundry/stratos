import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../store/types/api.types';
import { IServiceInstance } from '../../../../core/cf-api-svc.types';

@Component({
  selector: 'app-compact-service-instance-card',
  templateUrl: './compact-service-instance-card.component.html',
  styleUrls: ['./compact-service-instance-card.component.scss']
})
export class CompactServiceInstanceCardComponent implements OnInit {

  @Input('serviceInstance') serviceInstance: APIResource<IServiceInstance>;
  constructor() { }

  ngOnInit() {
  }

}


