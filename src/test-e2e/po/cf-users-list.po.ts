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
    const conf = confirm.confirm();
    expect(this.isPresent()).toBeFalsy();
    return conf;
  }
}

class UserRolesCell extends ChipsComponent {
  static unknownOrgSpace = '??unknown';

  constructor(cell: ElementFinder) {
    super(cell.element(by.css('app-chips')));
  }

  getUserRoles(isOrg = true): promise.Promise<CfUserRoles> {
    return this.getChips()
      .then(chips => promise.all(chips.map(chip => chip.getText())))
      .then(chipTexts => this.cleanRolesList(chipTexts, isOrg));
  }

  private cleanRolesList(roles: string[], isOrg = true): CfUserRoles {
    return roles.reduce((res, role, index) => {
      const cleanRole = role.replace('\nclose', '');
      const split = cleanRole.split(': ');
      let org, space, value;
      switch (split.length) {
        case 3:
          org = split[0];
          space = split[1];
          value = split[2];
          break;
        case 2:
          if (isOrg) {
            org = split[0];
            value = split[1];
          } else {
            org = UserRolesCell.unknownOrgSpace;
            space = split[0];
            value = split[1];
          }
          break;
        case 1:
          org = UserRolesCell.unknownOrgSpace;
          space = UserRolesCell.unknownOrgSpace;
          value = split[0];
          break;
      }

      if (!res[org]) {
        res[org] = {
          roles: [],
          spaces: {}
        };
      }
      if (isOrg) {
        res[org].roles.push(value);
        return res;
      }

      if (!res[org].spaces[space]) {
        res[org].spaces[space] = [];
      }
      res[org].spaces[space].push(value);
      return res;
    }, {});
  }


}
export class CFUsersListComponent extends ListComponent {

  getUserRoles(rowIndex: number): promise.Promise<{ orgRoles: CfUserRoles, spaceRoles: CfUserRoles }> {
    const orgs = new UserRolesCell(this.table.getCell(rowIndex, 2));
    const spaces = new UserRolesCell(this.table.getCell(rowIndex, 3));

    return promise.all([
      orgs.expandIfCan(),
      spaces.expandIfCan(),
    ])
      .then(() => promise.all([
        orgs.getUserRoles(true),
        spaces.getUserRoles(false)
      ])
      )
      .then(([orgRoles, spaceRoles]) => ({
        orgRoles,
        spaceRoles
      })
      );
  }

  getPermissionChip(rowIndex: number, orgName: string, spaceName: string, isOrgRole: boolean, roleName: string)
    : UserRoleChip {
    console.log(rowIndex, isOrgRole);
    const userRolesCell = isOrgRole ? new UserRolesCell(this.table.getCell(rowIndex, 2))
      : new UserRolesCell(this.table.getCell(rowIndex, 3));
    let chipString = '';
    if (orgName) {
      chipString = orgName + ': ';
    }
    if (spaceName) {
      chipString += spaceName + ': ';
    }
    chipString += roleName;
    return new UserRoleChip(userRolesCell.getCellWithText(chipString).getComponent().locator(), chipString);
  }
}
