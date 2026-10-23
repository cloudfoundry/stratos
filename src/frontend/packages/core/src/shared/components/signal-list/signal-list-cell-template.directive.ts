import { Directive, inject, TemplateRef, input } from '@angular/core';

// Tags an <ng-template> as a named cell renderer for a SignalList column
// of `kind: 'template'`. SignalListComponent collects every directive
// instance via ContentChildren, then SignalListColumn.templateName picks
// the one to render for that column. Lets pages plug in arbitrary cell
// components (custom checkboxes, status pills with internal logic, etc.)
// without growing a new `kind` for every shape.
//
// Usage:
//   <app-signal-list [config]="config">
//     <ng-template appSignalListCell="manager" let-row>
//       <app-some-custom-cell [row]="row"></app-some-custom-cell>
//     </ng-template>
//   </app-signal-list>
@Directive({
  selector: 'ng-template[appSignalListCell]',
  standalone: true,
})
export class SignalListCellTemplateDirective<T = unknown> {
  readonly name = input<string>(undefined, { alias: 'appSignalListCell' });

  public readonly template = inject<TemplateRef<{ $implicit: T; row: T }>>(TemplateRef);
}
