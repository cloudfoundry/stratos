import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'app-add-route-stepper',
  templateUrl: './add-route-stepper.component.html',
  styleUrls: ['./add-route-stepper.component.scss']
})
export class AddRouteStepperComponent {
  @HostBinding('class') class = 'router-component';
}
