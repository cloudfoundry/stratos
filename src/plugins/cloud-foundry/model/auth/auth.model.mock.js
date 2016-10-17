(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryModel = mock.cloudFoundryModel || {};

  function setupSpaces(userGuid, isSpaceManager, isSpaceDeveloper, $httpBackend) {

    $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllAuditedSpacesForUser(userGuid).url).respond(
      mock.cloudFoundryAPI.Users.ListAllAuditedOrganizationsForUser(userGuid).success.code,
      mock.cloudFoundryAPI.Users.ListAllAuditedOrganizationsForUser(userGuid).success.response.data);

    if (isSpaceManager) {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllManagedSpacesForUser(userGuid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllManagedSpacesForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllManagedSpacesForUser(userGuid).success.is_manager.response.data);
    } else {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllManagedSpacesForUser(userGuid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllManagedSpacesForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllManagedSpacesForUser(userGuid).success.is_not_manager.response.data);
    }

    if (isSpaceDeveloper) {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).success.is_developer.response.data);
    } else {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllSpacesForUser(user_guid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).success.is_not_developer.response.data);
    }
  }

  function setupOrganizations(userGuid, isOrgManager, $httpBackend) {

    $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllAuditedOrganizationsForUser(userGuid).url).respond(
      mock.cloudFoundryAPI.Users.ListAllAuditedOrganizationsForUser(userGuid).success.code,
      mock.cloudFoundryAPI.Users.ListAllAuditedOrganizationsForUser(userGuid).success.response.data);

    $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllBillingManagedOrganizationsForUser(userGuid).url).respond(
      mock.cloudFoundryAPI.Users.ListAllBillingManagedOrganizationsForUser(userGuid).success.code,
      mock.cloudFoundryAPI.Users.ListAllBillingManagedOrganizationsForUser(userGuid).success.response.data);

    if (isOrgManager) {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllManagedOrganizationsForUser(userGuid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllManagedOrganizationsForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllManagedOrganizationsForUser(userGuid).success.is_manager.response.data);
    } else {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllManagedOrganizationsForUser(userGuid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllManagedOrganizationsForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllManagedOrganizationsForUser(userGuid).success.is_not_manager.response.data);
    }

    $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllOrganizationsForUser(userGuid).url).respond(
      mock.cloudFoundryAPI.Users.ListAllOrganizationsForUser(userGuid).success.code,
      mock.cloudFoundryAPI.Users.ListAllOrganizationsForUser(userGuid).success.response.data);

  }

  function setupFeatureFlagsRequest($httpBackend) {
    $httpBackend.whenGET(mock.cloudFoundryAPI.FeatureFlags.GetAllFeatureFlags().url).respond(
      mock.cloudFoundryAPI.FeatureFlags.GetAllFeatureFlags().success.code,
      mock.cloudFoundryAPI.FeatureFlags.GetAllFeatureFlags().success.response);
  }

  function setupSummary(userGuid, $httpBackend) {
    $httpBackend.whenGET(mock.cloudFoundryAPI.Users.GetUserSummary(userGuid).url).respond(
      mock.cloudFoundryAPI.Users.GetUserSummary(userGuid).success.code,
      mock.cloudFoundryAPI.Users.GetUserSummary(userGuid).success.response);
  }

  function setupStackatoInfo(isAdmin, modelManager) {
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    stackatoInfo.info = {
      endpoints: {
        hcf: {
          guid: {
            guid: 'guid',
            name: 'myHCF',
            version: '',
            user: {guid: 'userGuid', name: 'test', admin: isAdmin},
            type: ''
          }
        }
      }
    };
  }

  mock.cloudFoundryModel.Auth = {

    initAuthModel: function (role, userGuid, $injector) {

      var isAdmin = false;
      var isOrgManager = false;
      var isSpaceManager = true;
      var isSpaceDeveloper = true;
      if (role === 'admin' || role === 'org_manager') {
        isAdmin = role === 'admin';
        isOrgManager = role === 'org_manager';
      } else if (role === 'space_manager') {
        isSpaceManager = true;
      } else {
        isSpaceDeveloper = true;
        isOrgManager = false;
        isSpaceManager = false;
      }
      var $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      setupStackatoInfo(isAdmin, modelManager);
      setupFeatureFlagsRequest($httpBackend);
      if (isAdmin) {
        setupSummary(userGuid, $httpBackend);
      } else {
        setupOrganizations(userGuid, isOrgManager, $httpBackend);
        setupSpaces(userGuid, isSpaceManager, isSpaceDeveloper, $httpBackend);
      }

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      authModel.initializeForEndpoint('guid', true);
      $httpBackend.flush();
    }
  };

  /* eslint-enable quote-props */
})
(this.mock = this.mock || {});
