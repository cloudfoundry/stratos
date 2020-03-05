export class Domain {

  constructor(
    public guid: string,
    public name: string,
    /* tslint:disable-next-line:variable-name  */
    public router_group_guid?: string,
    /* tslint:disable-next-line:variable-name  */
    public router_group_type?: string,
  ) { }
}
