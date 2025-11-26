import { Directive, Input, Optional, inject } from '@angular/core';
import { RouterLink, RouterLinkWithHref } from '@angular/router';

@Directive({
  selector: '[routerLink][appDisableRouterLink]',
  standalone: true
})
export class DisableRouterLinkDirective {

  @Input() appDisableRouterLink: boolean = false;

  private routerLink = inject(RouterLink, { optional: true });
  private routerLinkWithHref = inject(RouterLinkWithHref, { optional: true });

  constructor() {
    const link = this.routerLink || this.routerLinkWithHref;

    if (!link) {
      return;
    }

    // Save original method
    const onClick = link.onClick;

    // Replace method
    link.onClick = (...args) => {
      if (this.appDisableRouterLink) {
        return !this.routerLinkWithHref;
      } else {
        return onClick.apply(link, args);
      }
    };
  }

}
