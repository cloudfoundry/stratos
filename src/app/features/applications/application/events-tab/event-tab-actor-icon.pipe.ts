import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventTabActorIcon'
})
export class EventTabActorIconPipe implements PipeTransform {

  transform(actor: string, args?: any): any {
    switch (actor) {
      case 'user':
        return 'person';
      case 'app':
        return 'web_asset';
      case 'process':
        return 'settings';
      default:
        return 'help';
    }
  }

}
