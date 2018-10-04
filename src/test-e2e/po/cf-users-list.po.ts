import { ListComponent } from './list.po';
import { promise, by, ElementFinder } from 'protractor';
import { ChipsComponent } from './chips.po';
import { Component } from './component.po';
import { ChipComponent } from './chip.po';
import { ConfirmDialogComponent } from './confirm-dialog';

interface CfUserRoles {
  [orgName: string]: {
    roles: string[],
    spaces: {
      [spaceName: string]: string[]
    }
  };
}

export class UserRoleChip extends ChipComponent {
  constructor(locator: ElementFinder, public roleText: string) {
    super(locator);
  }

  check(canClose: boolean) {
    expect(this.isDisplayed()).toBeTruthy();
    if (canClose) {
      expect(this.getCross().isDisplayed()).toBeTruthy();
    } else {
      expect(this.getCross().isPresent()).toBeFalsy();
    }
  }

  remove(): promise.Promise<void> {
    this.getCross().click();
    const confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toContain(this.roleText);
    });
    confirm.confirm();
    confirm.waitUntilNotShown('Confirmation dialog');
    return this.waitUntilNotShown('User Role Chip: ' + this.roleText);
  }
}

class UserRolesCell extends ChipsComponent {
  constructor(cell: ElementFinder) {
    super(cell.element(by.css('app-chips')));
  }
}

export class CFUsersListComponent extends ListComponent {

  expandOrgsChips(rowIndex: number) {
    return this.expandPermissionChip(rowIndex, true);
  }

  expandSpaceChips(rowIndex: number) {
    return this.expandPermissionChip(rowIndex, false);
  }

  private expandPermissionChip(rowIndex: number, isOrg = true) {
    return this.getPermissions(rowIndex, isOrg).expandIfCan();
  }

  getPermissions(rowIndex: number, isOrg = true) {
    return isOrg ?
      new UserRolesCell(this.table.getCell(rowIndex, 2)) :
      new UserRolesCell(this.table.getCell(rowIndex, 3));
  }

  getPermissionChip(rowIndex: number, orgName: string, spaceName: string, isOrgRole: boolean, roleName: string)
    : UserRoleChip {
    const userRolesCell = this.getPermissions(rowIndex, isOrgRole);
    let chipString = '';
    if (orgName) {
      chipString = orgName + ': ';
    }
    if (spaceName) {
      chipString += spaceName + ': ';
    }
    chipString += roleName;
    return new UserRoleChip(userRolesCell.getCellWithText(chipString).getComponent(), chipString);
  }
}
