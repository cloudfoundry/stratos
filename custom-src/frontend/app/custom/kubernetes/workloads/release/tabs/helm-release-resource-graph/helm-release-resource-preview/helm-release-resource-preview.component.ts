import { Component } from '@angular/core';
import { PreviewableComponent } from 'frontend/packages/core/src/shared/previewable-component';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-helm-release-resource-preview',
  templateUrl: './helm-release-resource-preview.component.html',
  styleUrls: ['./helm-release-resource-preview.component.scss'],
})
export class HelmReleaseResourcePreviewComponent implements PreviewableComponent {

  public resource$: Observable<any>;

  setProps(props: { [key: string]: any; }): void {
    this.resource$ = props.helper.fetchReleaseResources().pipe(
      map((r: any[]) => {
        const item = Object.values(r).find((res: any) => res.metadata.name === props.node.label && res.metadata.kind === props.node.kind);

        const newItem = { ...item };
        newItem.age = moment(item.metadata.creationTimestamp).fromNow(true);

        newItem.labels = [];
        Object.keys(item.metadata.labels).forEach(labelName => {
          newItem.labels.push({
            name: labelName,
            value: item.metadata.labels[labelName]
          });
        });

        if (item.metadata && item.metadata.annotations) {
          newItem.annotations = [];
          Object.keys(item.metadata.annotations).forEach(labelName => {
            newItem.annotations.push({
              name: labelName,
              value: item.metadata.annotations[labelName]
            });
          });
        }

        return newItem;
      })
    );

  }

  constructor() { }

}
