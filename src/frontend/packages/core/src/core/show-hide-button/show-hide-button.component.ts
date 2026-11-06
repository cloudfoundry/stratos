import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';

@Component({
  selector: 'app-show-hide-button',
  templateUrl: './show-hide-button.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowHideButtonComponent {

  readonly changed = output<boolean>();

  // A model: the button itself flips it.
  readonly show = model(false);

  toggle() {
    this.show.update(show => !show);
    this.changed.emit(this.show());
  }

}
