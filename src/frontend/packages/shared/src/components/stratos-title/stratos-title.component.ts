import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-stratos-title",
  templateUrl: "./stratos-title.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class StratosTitleComponent {
  // Optional title
  @Input() title?: string;
}
