import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

import { IBreadcrumbLink } from './breadcrumbs.types';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbsComponent {
  // Presentational only: renders an already-resolved flat trail. Callers own
  // the ?breadcrumbs= key resolution (page-header resolves it reactively).
  // Colour/size are inherited from the host context so the trail sits inline
  // with an adjacent page title.
  @Input() breadcrumbs: IBreadcrumbLink[] | null = [];
}
