import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-eula-content',
  templateUrl: '../../../../assets/eula.html'
})
export class EulaPageContentComponent { }

@Component({
  selector: 'app-eula-page',
  templateUrl: './eula-page.component.html',
  styleUrls: ['./eula-page.component.scss']
})
export class EulaPageComponent implements OnInit {

  public breadcrumbs = [
    {
      breadcrumbs: [{ value: 'About', routerLink: '/about' }]
    }
  ];

  constructor() { }

  ngOnInit() {

  }

}
