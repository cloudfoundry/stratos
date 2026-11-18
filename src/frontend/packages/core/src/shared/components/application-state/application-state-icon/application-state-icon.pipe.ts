import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'applicationStateIcon',
  standalone: true
})
export class ApplicationStateIconPipe implements PipeTransform {

  private result(outputType: string, value: string, cssClass: string, icon: string) {
    switch (outputType) {
      case 'class':
        return cssClass;
      case 'icon':
        return icon;
      case 'label':
        // The state's name for assistive technology: 'STARTED' -> 'Started', 'ok' -> 'OK'.
        return value === 'ok' ? 'OK' : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      default:
        return '';
    }
  }

  transform(value: string | null | undefined, args?: string): string {
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
        // Hollow, so it differs from the filled ok circle by shape and not
        // by color alone (WCAG 1.4.1).
        return this.result(args, value, 'text-tentative', 'radio_button_unchecked');
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
