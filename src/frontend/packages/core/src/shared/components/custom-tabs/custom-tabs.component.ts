import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MatTabChangeEvent {
  index: number;
  tab: CustomTabComponent;
}

@Component({
  selector: 'app-tab',
  template: '<ng-template><ng-content></ng-content></ng-template>',
  standalone: true
})
export class CustomTabComponent {
  @Input() label = '';
  @Input() disabled = false;
  @Input() textLabel = '';

  @ViewChild(TemplateRef, { static: true }) content: TemplateRef<any>;

  isActive = false;
}

@Component({
  selector: 'app-tab-group',
  templateUrl: './custom-tabs.component.html',
  styleUrls: ['./custom-tabs.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class CustomTabGroupComponent implements AfterContentInit {
  @Input() selectedIndex = 0;
  @Input() backgroundColor = 'primary';
  @Input() color = 'primary';

  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() selectedTabChange = new EventEmitter<MatTabChangeEvent>();

  @ContentChildren(CustomTabComponent) tabs: QueryList<CustomTabComponent>;

  ngAfterContentInit() {
    this.selectTab(this.selectedIndex);
  }

  selectTab(index: number) {
    if (index < 0 || index >= this.tabs.length) return;

    const newTab = this.tabs.toArray()[index];
    if (newTab.disabled) return;

    this.tabs.forEach((tab, i) => {
      tab.isActive = i === index;
    });

    this.selectedIndex = index;
    this.selectedIndexChange.emit(index);
    this.selectedTabChange.emit({
      index: index,
      tab: newTab
    });
  }

  getTabsArray() {
    return this.tabs ? this.tabs.toArray() : [];
  }

  getActiveTab() {
    return this.getTabsArray().find(tab => tab.isActive);
  }
}