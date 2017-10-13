import { FocusDirective } from './focus.directive';
import { inject } from '@angular/core/testing';

describe('FocusDirective', () => {
  let focusDirective: FocusDirective;

  beforeEach(inject([FocusDirective], fd => {
    focusDirective = fd;
  }));

  it('should create an instance', () => {
    expect(focusDirective).toBeTruthy();
  });
});
