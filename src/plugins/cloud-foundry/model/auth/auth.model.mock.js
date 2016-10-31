(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryModel = mock.cloudFoundryModel || {};

  function setupSpaces(userGuid, isSpaceManager, isSpaceDeveloper, $httpBackend, orgGuid, spaceGuid) {

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
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid, spaceGuid, orgGuid).url).respond(
        mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).success.code,
        mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid).success.is_developer.response.data);
    } else {
      $httpBackend.whenGET(mock.cloudFoundryAPI.Users.ListAllSpacesForUser(userGuid, spaceGuid, orgGuid).url).respond(
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
      mock.cloudFoundryAPI.FeatureFlags.GetAllFeatureFlags().success.response.data);
  }

  function setupSummary(userGuid, spaceGuid, $httpBackend) {

    $httpBackend.whenGET(mock.cloudFoundryAPI.Users.GetUserSummary(userGuid, spaceGuid).url).respond(
      mock.cloudFoundryAPI.Users.GetUserSummary(userGuid, spaceGuid).success.code,
      mock.cloudFoundryAPI.Users.GetUserSummary(userGuid, spaceGuid).success.response);
  }

  function setupStackatoInfo(isAdmin, userGuid, cnsiGuid, modelManager) {
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    stackatoInfo.info = {};
    _.set(stackatoInfo.info, 'endpoints.hcf.' + cnsiGuid, {
      guid: cnsiGuid,
      name: 'myHCF',
      version: '',
      user: {guid: userGuid, name: 'test', admin: isAdmin},
      type: ''
    });
  }

  mock.cloudFoundryModel.Auth = {

    initAuthModel: function ($injector, opts) {

      var isAdmin = false;
      var isOrgManager = false;
      var isSpaceManager = true;
      var isSpaceDeveloper = true;
      if (opts.role === 'admin' || opts.role === 'org_manager') {
        isAdmin = opts.role === 'admin';
        isOrgManager = opts.role === 'org_manager';
      } else if (opts.role === 'space_manager') {
        isSpaceManager = true;
        isSpaceDeveloper = false;
      } else {
        isSpaceDeveloper = true;
        isOrgManager = false;
        isSpaceManager = false;
      }

      opts.cnsiGuid = opts.cnsiGuid || 'cnsiGuid';
      opts.userGuid = opts.userGuid || 'userGuid';

      var $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      setupStackatoInfo(isAdmin, opts.userGuid, opts.cnsiGuid, modelManager);
      setupFeatureFlagsRequest($httpBackend);
      if (isAdmin) {
        // Need to pass known space GUID for application ACL tests
        setupSummary(opts.userGuid, opts.spaceGuid, $httpBackend);
      } else {
        setupOrganizations(opts.userGuid, isOrgManager, $httpBackend);
        setupSpaces(opts.userGuid, isSpaceManager, isSpaceDeveloper, $httpBackend, opts.orgGuid, opts.spaceGuid);
      }

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      authModel.initializeForEndpoint(opts.cnsiGuid, true);

      $httpBackend.flush();
    }
  };

  /* eslint-enable quote-props */
})
(this.mock = this.mock || {});
