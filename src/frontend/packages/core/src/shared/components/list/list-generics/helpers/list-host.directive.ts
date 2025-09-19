import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
selector: '[list-host]',
standalone: false
})
export class ListHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
