import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-base',
  templateUrl: './dashboard-base.component.html',
  styleUrls: ['./dashboard-base.component.scss']
})
export class DashboardBaseComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('dashboard-base');
  }

}
