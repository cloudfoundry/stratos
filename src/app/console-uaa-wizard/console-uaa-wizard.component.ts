import { Component, OnInit, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-console-uaa-wizard',
  templateUrl: './console-uaa-wizard.component.html',
  styleUrls: ['./console-uaa-wizard.component.scss']
})
export class ConsoleUaaWizardComponent implements OnInit, AfterContentInit {

  constructor() { }

  steps = [
    1,
    2,
    3,
    4
  ];

  ngOnInit() {
  }

  ngAfterContentInit() {
  }

}
