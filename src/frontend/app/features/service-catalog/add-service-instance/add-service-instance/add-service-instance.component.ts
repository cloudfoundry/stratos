import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { ServicesService } from '../../services.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    TitleCasePipe
  ]
})
export class AddServiceInstanceComponent {
  title$: Observable<string>;
  serviceInstancesUrl: string;

  constructor(private servicesService: ServicesService
  ) {
    const cfId = servicesService.cfGuid;
    const serviceGuid = servicesService.serviceGuid;
    this.serviceInstancesUrl = `/marketplace/${cfId}/${serviceGuid}/instances`;
    this.title$ = this.servicesService.getServiceName().pipe(
      map(label => `Create Instance: ${label}`)
    );
  }
}
