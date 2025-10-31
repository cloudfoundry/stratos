import { ChangeDetectionStrategy, Component, Input} from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-filters',
  templateUrl: './list-filters.component.html',
  styleUrls: ['./list-filters.component.scss'],
  standalone: true,
  imports: []
})

export class ListFiltersComponent {
  @Input() public filters: { title: string, items: Array<Record<string, unknown>>, }[] = [];
}
