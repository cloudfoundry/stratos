'use strict';

var _ = require('lodash');
var randomstring = require("randomstring");
var noCache = require('connect-nocache')();
var utils = require('./utils');
exports.init = init;

var appsTemplate = require('../data/organisations.json').response;
var spacesTemplate = require('../data/spaces.json').response;

function init(router, config, proxy) {

  router.get('/pp/v1/proxy/v2/organizations', noCache, function (request, response) {
    response.json(mockOrgsResponse(request, config));
  });
  router.get('/pp/v1/proxy/v2/organizations/:id/spaces', noCache, function (request, response) {
    response.json(mockSpacesResponse(request, config));
  });
}

function mockOrgsResponse(request, config) {

  var orgCount = config.serviceInstances.orgs.count;
  var spacesCount = config.serviceInstances.orgs.spacesCount;

  var template = appsTemplate;

  var orgElement = template.resources[0];

  var cnsiList = utils.getCnsiList(request);
  var resultsPerPages = utils.getResultsPerPage(request);


  _.each(cnsiList, function (cnsi) {
    var organisations = [];
    for (var i = 0; i < orgCount; i++) {
      organisations.push(createMockOrganisation(orgElement, cnsi, i));
    }
    template.total_results = orgCount;
    template.total_pages = Math.floor(orgCount / resultsPerPages);
    template.resources = organisations;
  });


  return template;

}

function mockSpacesResponse(request, config) {

  // TODO passthrough
  var spacesCount = config.serviceInstances.orgs.spacesCount;

  var template = spacesTemplate;

  var spaceElement = template.resources[0];

  var cnsiList = utils.getCnsiList(request);
  var resultsPerPages = utils.getResultsPerPage(request);

  var orgId = request.params.id;

  _.each(cnsiList, function (cnsi) {
    var spaces = [];
    for (var i = 0; i < spacesCount; i++) {
      spaces.push(createMockSpace(spaceElement, orgId, i));
    }
    template.total_results = spacesCount;
    template.total_pages = (spacesCount / resultsPerPages);
    template.resources = spaces;
  });


  return template;

}

function createMockOrganisation(template, cnsi, index) {

  var orgTemplate = utils.clone(template);
  orgTemplate.metadata.guid = "org_" + index;
  orgTemplate.entity.name = "org_" + index;
  orgTemplate.entity.quota_definition_url = "/v2/quota_definitions/d32e33f7-6368-4684-9928-53b90f3097d9";
  orgTemplate.entity.spaces_url = "/v2/organizations/" + orgTemplate.guid + "/spaces";
  orgTemplate.entity.private_domains_url = "/v2/organizations/" + orgTemplate.guid + "/private_domains";
  orgTemplate.entity.users_url = "/v2/organizations/" + orgTemplate.guid + "/users_url";
  orgTemplate.entity.managers_url = "/v2/organizations/" + orgTemplate.guid + "/managers_url";
  orgTemplate.entity.billing_managers_url = "/v2/organizations/" + orgTemplate.guid + "/billing_managers_url";
  orgTemplate.entity.auditors_url = "/v2/organizations/" + orgTemplate.guid + "/auditors_url";
  orgTemplate.entity.app_events_url = "/v2/organizations/" + orgTemplate.guid + "/app_events_url";
  orgTemplate.entity.space_quota_definitions_url = "/v2/organizations/" + orgTemplate.guid + "/space_quota_definitions_url";

  return orgTemplate;
}

function createMockSpace(template, orgId, index) {

  var spaceTemplate = utils.clone(template);
  spaceTemplate.metadata.guid = orgId + "_space_" + index;
  spaceTemplate.entity.name = orgId + "_space_" + index;
  spaceTemplate.entity.quota_definition_url = "/v2/quota_definitions/d32e33f7-6368-4684-9928-53b90f3097d9";
  spaceTemplate.entity.organization_url = "/v2/organizations/" + orgId;
  spaceTemplate.entity.private_domains_url = "/v2/spaces/" + spaceTemplate.guid + "/private_domains";
  spaceTemplate.entity.users_url = "/v2/spaces/" + spaceTemplate.guid + "/users_url";
  spaceTemplate.entity.managers_url = "/v2/spaces/" + spaceTemplate.guid + "/managers_url";
  spaceTemplate.entity.billing_managers_url = "/v2/spaces/" + spaceTemplate.guid + "/billing_managers_url";
  spaceTemplate.entity.auditors_url = "/v2/spaces/" + spaceTemplate.guid + "/auditors_url";
  spaceTemplate.entity.app_events_url = "/v2/spaces/" + spaceTemplate.guid + "/app_events_url";
  spaceTemplate.entity.space_quota_definitions_url = "/v2/spaces/" + spaceTemplate.guid + "/space_quota_definitions_url";

  return spaceTemplate;
}
