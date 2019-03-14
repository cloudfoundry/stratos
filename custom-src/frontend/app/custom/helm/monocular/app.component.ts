import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from './shared/services/menu.service';
import { ChartsService } from './shared/services/charts.service';
import { ConfigService } from './shared/services/config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MenuService, ChartsService]
})
export class AppComponent {
  // Show the global menu
  public showMenu: boolean = false;
  // Config
  public config;

  constructor(
    config: ConfigService,
    private menuService: MenuService,
    private router: Router,
  ) {
    menuService.menuOpen$.subscribe(show => {
      this.showMenu = show;
    });

    // Hide menu when user changes the route
    router.events.subscribe(() => {
      menuService.hideMenu();
    });
    this.config = config;
  }
}
