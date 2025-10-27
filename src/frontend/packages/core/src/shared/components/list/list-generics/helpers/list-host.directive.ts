import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
selector: '[list-host]',
standalone: true
})
export class ListHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
