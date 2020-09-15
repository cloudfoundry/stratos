import { by, element, promise } from 'protractor';

import { Component } from './component.po';


export interface Breadcrumb {
  index: number;
  label: string;
  isLink: boolean;
  click: Function;
}

/**
 * Page Object for the Breadcrumbs component
 */
export class BreadcrumbsComponent extends Component {

  constructor() {
    super(element(by.css('.page-header__breadcrumbs')));
  }

  getBreadcrumbs(): promise.Promise<Breadcrumb[]> {
    return this.locator.all(by.css('.page-header__breadcrumb')).map((elm, index) => {
      return {
        index,
        label: elm.getText(),
        isLink: elm.getAttribute('class').then(cls => cls.indexOf('page-header__breadcrumb-link') >= 0),
        click: elm.click
      };
    });
  }

}
