import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-monocular-tab-base',
  templateUrl: './monocular-tab-base.component.html',
  styleUrls: ['./monocular-tab-base.component.scss']
})
export class MonocularTabBaseComponent implements OnInit {

  tabLinks = [
    { link: 'charts', label: 'Charts' },
    { link: 'repos', label: 'Repositories' },
    { link: 'releases', label: 'Releases' },
    { link: 'config', label: 'Config' },
  ];

  constructor() { }

  ngOnInit() { }

}
