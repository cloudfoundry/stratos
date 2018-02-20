import { objectHelper } from './../../../../../core/helper-classes/object.helpers';
import { ICellDefinition } from './../table.types';
import { Component } from '@angular/core';
import { TableCellCustom } from '../table-cell/table-cell-custom';

@Component({
    moduleId: module.id,
    selector: 'app-table-cell-default',
    templateUrl: 'app-table-cell-default.component.html',
    styleUrls: ['app-table-cell-default.component.scss']
})
export class TableCellDefaultComponent<T> extends TableCellCustom<T> {
    public cellDefinition: ICellDefinition<T>;
    public row: T;
    public value = null;
    public isLink: boolean;
    public isExternalLink: boolean;
    public linkValue: string;
    constructor() {
        super();
        const valueGenerator = this.getValueGenerator(this.cellDefinition);
        if (valueGenerator) {
            this.value = valueGenerator(this.row);
        }
        this.isLink = !!this.cellDefinition.getLink;
        this.isExternalLink = this.isLink && this.cellDefinition.externalLink;
    }

    private getValueGenerator(cellDefinition: ICellDefinition<T>) {
        const valueGetter = this.getValueGetter(cellDefinition);
        if (valueGetter) {
            const linkGetter = this.getLinkGetter(cellDefinition);
        }
        return null;
    }

    private getValueGetter(cellDefinition: ICellDefinition<T>) {
        if (cellDefinition.getValue) {
            return cellDefinition.getValue;
        } else if (cellDefinition.valuePath) {
            return (row: T) => objectHelper.getPathFromString(row, cellDefinition.valuePath);
        }
        return null;
    }

    private getLinkGetter(cellDefinition: ICellDefinition<T>) {

    }
}
