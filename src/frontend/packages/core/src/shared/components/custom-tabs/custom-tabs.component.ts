import {
  ChangeDetectionStrategy,
  Component,
  AfterContentInit,
  TemplateRef,
  input,
  model,
  output,
  viewChild,
  contentChildren
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

  readonly content = viewChild.required(TemplateRef);

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
  // A model: selecting a tab sets it and emits selectedIndexChange.
  readonly selectedIndex = model(0);
  readonly backgroundColor = input("primary");
  readonly color = input("primary");

  readonly selectedTabChange = output<MatTabChangeEvent>();

  // strict: @ContentChildren is populated by Angular before ngAfterContentInit
  readonly tabs = contentChildren(CustomTabComponent);

  ngAfterContentInit() {
    this.selectTab(this.selectedIndex());
  }

  selectTab(index: number) {
    if (index < 0 || index >= this.tabs().length) return;

    const newTab = this.tabs()[index];
    if (newTab.disabled()) return;

    this.tabs().forEach((tab, i) => {
      tab.isActive = i === index;
    });

    this.selectedIndex.set(index);
    this.selectedTabChange.emit({
      index: index,
      tab: newTab,
    });
  }

  getTabsArray() {
    return this.tabs();
  }

  getActiveTab() {
    return this.getTabsArray().find((tab) => tab.isActive);
  }
}
