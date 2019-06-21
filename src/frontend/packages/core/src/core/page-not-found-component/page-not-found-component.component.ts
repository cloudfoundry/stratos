import { Component } from '@angular/core';

@Component({
  selector: 'app-page-not-found-component',
  templateUrl: './page-not-found-component.component.html',
  styleUrls: ['./page-not-found-component.component.scss']
})
export class PageNotFoundComponentComponent {

  constructor() { }

  home() {
    window.location.assign('/');
  }

}
