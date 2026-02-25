import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
selector: '[list-host]',
standalone: true
})
export class ListHostDirective {
  public viewContainerRef = inject(ViewContainerRef);
}
