export class Domain {

  constructor(
    public guid: string,
    public name: string,
    public router_group_guid?: string,
    public router_group_type?: string,
  ) {}
}
