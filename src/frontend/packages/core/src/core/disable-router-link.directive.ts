import { Directive, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkWithHref } from '@angular/router';

@Directive({
  selector: '[routerLink][appDisableRouterLink]',
  standalone: true
})
export class DisableRouterLinkDirective {

  @Input() appDisableRouterLink: boolean = false;

  constructor() {
    const routerLink = inject(RouterLink, { optional: true });
    const routerLinkWithHref = inject(RouterLinkWithHref, { optional: true });


    const link = routerLink || routerLinkWithHref;
    if (!link) {
      // The selector requires [routerLink], so a RouterLink directive is
      // present in practice; bail out defensively if neither resolved.
      return;
    }

    // Save original method
    const onClick = link.onClick;

    // Replace method
    link.onClick = (...args) => {
      if (this.appDisableRouterLink) {
        return routerLinkWithHref ? false : true;
      } else {
        return onClick.apply(link, args);
      }
    };
  }

}
