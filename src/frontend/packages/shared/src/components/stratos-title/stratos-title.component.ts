import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-stratos-title",
  templateUrl: "./stratos-title.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/prefer-standalone -- declared in NgModule StratosComponentsModule (components.module.ts, out of scope); standalone migration tracked separately
  standalone: false,
})
export class StratosTitleComponent {
  // Optional title
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() title?: string;
}
