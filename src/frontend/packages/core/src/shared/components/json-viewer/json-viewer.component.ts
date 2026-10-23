import { ChangeDetectionStrategy, Component, OnChanges, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Segment {
  key: string;
  value: any;
  type: undefined | string;
  description: string;
  expanded: boolean;
}

@Component({
  selector: 'app-json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    JsonViewerComponent // Self-import for recursive rendering
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonViewerComponent implements OnChanges {

  readonly json = input<any>();

  readonly root = input<string>();

  // Whether to expand all initially
  readonly expanded = input(true);
  /**
   * deprecated It will be always true and deleted in version 3.0.0
   */
  readonly cleanOnChange = input(true);

  readonly small = input(false);

  segments: Segment[] = [];

  expand() {
    this.setExpansion(true);
  }

  collapse() {
    this.setExpansion(false);
  }

  private setExpansion(expanded: boolean) {
    this.segments.forEach(segment => {
      segment.expanded = expanded;
    });
  }

  ngOnChanges() {
    if (this.cleanOnChange()) {
      this.segments = [];
    }

    const json = this.json();
    if (!json) {
      return;
    }

    if (typeof json === 'object') {
      Object.keys(json).forEach(key => {
        this.segments.push(this.parseKeyValue(key, this.json()[key]));
      });
    } else {
      this.segments.push(this.parseKeyValue(`(${typeof json})`, json));
    }
  }

  isExpandable(segment: Segment) {
    return segment.type === 'object' || segment.type === 'array';
  }

  toggle(segment: Segment) {
    if (this.isExpandable(segment)) {
      segment.expanded = !segment.expanded;
    }
  }

  private parseKeyValue(key: any, value: any): Segment {
    const segment: Segment = {
      key,
      value,
      type: undefined,
      description: '' + value,
      expanded: this.expanded()
    };

    switch (typeof segment.value) {
      case 'number': {
        segment.type = 'number';
        break;
      }
      case 'boolean': {
        segment.type = 'boolean';
        break;
      }
      case 'function': {
        segment.type = 'function';
        break;
      }
      case 'string': {
        segment.type = 'string';
        segment.description = '"' + segment.value + '"';
        break;
      }
      case 'undefined': {
        segment.type = 'undefined';
        segment.description = 'undefined';
        break;
      }
      case 'object': {
        // yea, null is object
        if (segment.value === null) {
          segment.type = 'null';
          segment.description = 'null';
        } else if (Array.isArray(segment.value)) {
          segment.type = 'array';
          segment.description = 'Array[' + segment.value.length + '] ' + JSON.stringify(segment.value);
        } else if (segment.value instanceof Date) {
          segment.type = 'date';
        } else {
          segment.type = 'object';
          segment.description = 'Object ' + JSON.stringify(segment.value);
        }
        break;
      }
    }

    return segment;
  }
}
