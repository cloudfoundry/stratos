import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'applicationStateIcon'
})
export class ApplicationStateIconPipe implements PipeTransform {

  private result(outputType: string, value: string, cssClass: string, icon: string) {
    switch (outputType) {
      case 'class':
        return cssClass;
      case 'icon':
        return icon;
      default:
        return '';
    }
  }

  transform(value: string, args?: string): string {
    if (!value) {
      return '';
    }

    if (!args || !args.length) {
      return '';
    }

    switch (value) {
      case 'STARTED':
        return this.result(args, value, 'text-success', 'lens');
      case 'STOPPED':
        return this.result(args, value, 'text-danger', 'warning');
      case 'ok':
        return this.result(args, value, 'text-success', 'lens');
      case 'tentative':
        return this.result(args, value, 'text-tentative', 'lens');
      case 'incomplete':
        return this.result(args, value, 'text-tentative', 'broken_image');
      case 'warning':
        return this.result(args, value, 'text-warning', 'warning');
      case 'error':
        return this.result(args, value, 'text-danger', 'cancel');
      case 'deleted':
        return this.result(args, value, 'text-success', 'delete');
      case 'busy':
        return this.result(args, value, '', 'hourglass_empty');
      default:
        return '';
    }

  }

}
