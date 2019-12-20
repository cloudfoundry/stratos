import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator } from '@angular/forms';
import { Observable, of } from 'rxjs';

interface DockerImageValidateResponse {
  dockerImageInvalid: boolean;
}

/* tslint:disable:no-use-before-declare  */
const DOCKER_IMAGE_VALIDATE = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => DockerImageValidateDirective), multi: true
};
/* tslint:enable */

@Directive({
  selector: '[appDockerImageValidate][ngModel]',
  providers: [DOCKER_IMAGE_VALIDATE]

})
export class DockerImageValidateDirective implements Validator {

  @Input() appDockerImageValidate: string;

  // TODO: RC consider scrapping, can include hostname before and other logic?
  // Must be of the form USER/NAME - where NAME must be at least 2 charts in length
  private isValidDockerImageName(name: string) {
    // const parts = name.split('/');
    // return parts.length === 2 && parts[1].length > 2;
    return true;
  }

  validate(c: AbstractControl): Observable<DockerImageValidateResponse> {
    // This is styled on appGithubProjectExists, in the future it would be nice to check with docker if the project exists
    // (only docker hub supported?)
    return of(this.isValidDockerImageName(c.value) ? null : {
      dockerImageInvalid: true,
    });
  }

}
