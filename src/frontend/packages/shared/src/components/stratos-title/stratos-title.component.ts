import { Component, ChangeDetectionStrategy, input } from "@angular/core";

@Component({
  selector: "app-stratos-title",
  templateUrl: "./stratos-title.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/prefer-standalone -- declared in NgModule StratosComponentsModule (components.module.ts, out of scope); standalone migration tracked separately
  standalone: false,
})
export class StratosTitleComponent {
  // Optional title
  readonly title = input<string>();
}
