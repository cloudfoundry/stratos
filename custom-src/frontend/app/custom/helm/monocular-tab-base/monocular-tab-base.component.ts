import { Component } from '@angular/core';

@Component({
  selector: 'app-monocular-tab-base',
  templateUrl: './monocular-tab-base.component.html',
  styleUrls: ['./monocular-tab-base.component.scss']
})
export class MonocularTabBaseComponent {

  tabLinks = [
    { link: 'charts', label: 'Charts', icon: 'folder_open' },
    { link: 'repos', label: 'Repositories', icon: 'products', iconFont: 'stratos-icons' },
    { link: 'releases', label: 'Releases', icon: 'apps' },
    { link: 'config', label: 'Config', icon: 'build' },
  ];

}

