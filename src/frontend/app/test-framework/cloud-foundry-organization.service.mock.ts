import { GetAllOrgUsers } from '../store/actions/organization.actions';

export class CloudFoundryOrganizationServiceMock {
  allOrgUsersAction = new GetAllOrgUsers('guid', 'guid-key', 'guid');
  allOrgUsers = {};
}
