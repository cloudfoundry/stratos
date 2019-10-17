import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[list-host]',
})
export class ListHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
