import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { ServicesService } from '../../services.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider
  ]
})
export class AddServiceInstanceComponent implements OnInit {
  title$: Observable<string>;
  serviceInstancesUrl: string;

  constructor(private servicesService: ServicesService
  ) {
    const cfId = servicesService.cfGuid;
    const serviceGuid = servicesService.serviceGuid;
    this.serviceInstancesUrl = `/service-catalog/${cfId}/${serviceGuid}/instances`;
    this.title$ = this.servicesService.getServiceName().pipe(
      map(label => `Create ${label} Instance`)
    );
  }

  ngOnInit() {
  }

}
