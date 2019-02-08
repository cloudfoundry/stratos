import { by, ElementFinder, promise, element } from 'protractor';

import { Component } from './component.po';
import { BooleanIndicatorComponent } from './boolean-indicator.po';

export class MetaDataItemComponent extends Component {

  static withLabel(locator: ElementFinder, label: string): MetaDataItemComponent {
    return new MetaDataItemComponent(locator.element(by.css(`app-metadata-item[label="${label}"]`)));
  }

  // Use when the label can change
  static withDynamicLabel(locator: ElementFinder, label: string): MetaDataItemComponent {
    return new MetaDataItemComponent(
      locator.element(by.cssContainingText('app-metadata-item .metadata-item__label', label)).element(by.xpath('..')));
  }

  constructor(private elementFinder: ElementFinder) {
    super(elementFinder);
  }

  public getLabel(): promise.Promise<string> {
    return this.locator.element(by.css('.metadata-item__label')).getText();
  }

  public getValue(): promise.Promise<string> {
    return this.locator.element(by.css('.metadata-item__value')).getText();
  }

  public getBooleanIndicator(): BooleanIndicatorComponent {
    return new BooleanIndicatorComponent(this.locator.element(by.css('.metadata-item__value')));
  }

}
