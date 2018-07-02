import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel } from '@angular/router';
import { Observable } from 'rxjs'; import { map } from 'rxjs/operators';
;

@Component({
  selector: 'app-routing-indicator',
  templateUrl: './routing-indicator.component.html',
  styleUrls: ['./routing-indicator.component.scss']
})
export class RoutingIndicatorComponent implements OnInit {

  constructor(private router: Router) { }
  public isRouting: Observable<number>;
  ngOnInit() {
    this.router.events.pipe(
      map(event => {
        if (event instanceof NavigationStart) {
          return 0;
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel
        ) {
          return false;
        }
      })
    );
  }

}
