import { Component, Input, OnInit } from '@angular/core';

export interface SideNavItem {
  text: string;
  mdIcon: string;
  link: string;
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})

export class SideNavComponent implements OnInit {

  constructor() { }

  @Input() tabs: SideNavItem[];

  ngOnInit() {
  }

}
