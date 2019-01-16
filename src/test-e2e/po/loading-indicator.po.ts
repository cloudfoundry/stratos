import { by, element, ElementFinder } from 'protractor';

import { Component } from './component.po';


export class LoadingIndicatorComponent extends Component {

  constructor(parent?: ElementFinder) {
    super(parent ? parent.element(by.css('.loading-page__indicator')) : element(by.css('.loading-page__indicator')));
  }
}
