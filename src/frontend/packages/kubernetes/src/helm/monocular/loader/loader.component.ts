import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppBusyComponent } from '@stratosui/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  standalone: true,
  imports: [AppBusyComponent]
})
export class LoaderComponent {
  // Show the loader or the content
  public readonly loading = input(false);
}
