import { promise } from 'protractor';

import { ConfirmDialogComponent } from '../../po/confirm-dialog';
import { FormComponent } from '../../po/form.po';
import { ListComponent } from '../../po/list.po';
import { ApplicationBasePage } from './application-page.po';

export class ApplicationPageVariablesTab extends ApplicationBasePage {

  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'variables');
    this.list = new ListComponent();
  }

  addVariable(name: string, value: string): promise.Promise<any> {
    this.list.header.getAdd().click();
    const addForm = new FormComponent(this.list.header.getInlineAddForm());
    addForm.waitUntilShown();
    addForm.fill({ envvarname: name, envvarvalue: value });
    this.list.header.getInlineAddFormAdd().click();
    return this.list.table.waitUntilNotBusy();
  }

  editVariable(rowIndex: number, newValue: string): promise.Promise<any> {
    this.list.table.editRow(rowIndex, 'envvarvalue', newValue);
    return this.list.table.waitUntilNotBusy();
  }

  deleteVariable(rowIndex: number, variableName: string): promise.Promise<any> {
    this.list.table.openRowActionMenuByIndex(rowIndex).clickItem('Delete');
    const confirm = new ConfirmDialogComponent();
    confirm.waitUntilShown();
    confirm.waitForMessage(`Are you sure you want to delete '${variableName}'?`);
    confirm.confirm();
    return this.list.table.waitUntilNotBusy();
  }
}
