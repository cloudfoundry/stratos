import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventTabActorIcon',
  standalone: true
})
export class EventTabActorIconPipe implements PipeTransform {

  transform(actor: string, _args?: unknown): string {
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
