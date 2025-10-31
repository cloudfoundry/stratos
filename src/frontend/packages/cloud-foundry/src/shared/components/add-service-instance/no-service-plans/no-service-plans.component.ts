import { Component, OnInit , ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-no-service-plans',
  templateUrl: './no-service-plans.component.html',
  styleUrls: ['./no-service-plans.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class NoServicePlansComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
