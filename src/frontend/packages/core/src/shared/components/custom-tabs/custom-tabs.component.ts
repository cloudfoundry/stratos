import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ContentChildren,
  QueryList,
  AfterContentInit,
  ViewChild,
  TemplateRef,
  input,
  output
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";

export interface MatTabChangeEvent {
  index: number;
  tab: CustomTabComponent;
}

@Component({
  selector: "app-tab",
  template: "<ng-template><ng-content></ng-content></ng-template>",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabComponent {
  readonly label = input("");
  readonly disabled = input(false);
  readonly textLabel = input("");

  @ViewChild(TemplateRef, { static: true }) content!: TemplateRef<any>;

  isActive = false;
}

@Component({
  selector: "app-tab-group",
  templateUrl: "./custom-tabs.component.html",
  styleUrls: ["./custom-tabs.component.scss"],
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabGroupComponent implements AfterContentInit {
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() selectedIndex = 0;
  readonly backgroundColor = input("primary");
  readonly color = input("primary");

  readonly selectedIndexChange = output<number>();
  readonly selectedTabChange = output<MatTabChangeEvent>();

  // strict: @ContentChildren is populated by Angular before ngAfterContentInit
  @ContentChildren(CustomTabComponent) tabs!: QueryList<CustomTabComponent>;

  ngAfterContentInit() {
    this.selectTab(this.selectedIndex);
  }

  selectTab(index: number) {
    if (index < 0 || index >= this.tabs.length) return;

    const newTab = this.tabs.toArray()[index];
    if (newTab.disabled()) return;

    this.tabs.forEach((tab, i) => {
      tab.isActive = i === index;
    });

    this.selectedIndex = index;
    this.selectedIndexChange.emit(index);
    this.selectedTabChange.emit({
      index: index,
      tab: newTab,
    });
  }

  getTabsArray() {
    return this.tabs ? this.tabs.toArray() : [];
  }

  getActiveTab() {
    return this.getTabsArray().find((tab) => tab.isActive);
  }
}
