import { CfAuthPrinciple } from '../principal';
export class CfAuthBaseAccess {

  constructor(private basePrincipal: CfAuthPrinciple) { }

  baseCreate() {
    return this.basePrincipal.isAdmin;
  }

  baseUpdate() {
    return this.basePrincipal.isAdmin;
  }

  baseDelete() {
    return this.basePrincipal.isAdmin;
  }

  protected doesContainGuid(array, guid): boolean {
    return !!array.find((entity) => {
      return entity.metadata.guid;
    });
  }
}
