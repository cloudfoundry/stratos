import { by, element } from 'protractor';

import { Component } from './component.po';


export class LoadingIndicatorComponent extends Component {

  constructor() {
    super(element(by.css('.loading-page__indicator')));
  }
}
