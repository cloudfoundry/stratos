(function () {
  'use strict';

  angular
    .module('code-engine.view.application')
    .factory('ceAppPipelineService', utilsService);

  /**
   * @namespace code-engine.service
   * @memberOf code-engine.service
   * @name utilsService
   * @description
   * @param {object} $q - the Angular $q service
   * @param {app.api.apiManager} modelManager - the application model manager
   * @returns {object} the service instance service
   */
  function utilsService($q, modelManager) {

    var hceCnsi, hceServiceInfo;

    return {
      listHceCnsis: listHceCnsis,
      updateDeliveryPipelineMetadata: updateDeliveryPipelineMetadata,
      deleteApplicationPipeline: deleteApplicationPipeline
    };

    /**
     * @function listHceCnsis
     * @memberof ceUtilsService
     * @description Invoke the /info endpoint of all HCE instances available to the user, in order to get their public API url.
     * The url we have registered can be different to the API url returned by the /info endpoint.
     * @returns {promise} A promise object
     * @private
     */
    function listHceCnsis() {
      // We cache on the application - so if you add an HCE while on the app, we won't detect that
      // Saves making lots of calls
      var userCnsiModel = _getUserCnsiModel();
      if (hceServiceInfo) {
        return $q.when(hceServiceInfo);
      } else {
        var promise = userCnsiModel.serviceInstances && _.keys(userCnsiModel.serviceInstances).length
          ? $q.when(userCnsiModel.serviceInstances) : userCnsiModel.list();
        return promise.then(function () {
          // Retrieve dynamicllay as this model may load before the one we need
          var hceModel = modelManager.retrieve('code-engine.model.hce');
          var hceCnsis = _.filter(userCnsiModel.serviceInstances, {cnsi_type: 'hce'}) || [];
          if (hceCnsis.length === 0) {
            return $q.when(hceCnsis);
          }
          var hceCnsisGuids = _.chain(hceCnsis).map('guid').value();
          return hceModel.infos(hceCnsisGuids.join(',')).then(function (infos) {
            _.each(hceCnsis, function (cnsi) {
              cnsi.info = infos[cnsi.guid];
            });
            hceServiceInfo = hceCnsis;
            return hceCnsis;
          });
        });
      }
    }

    /**
     * @function updateDeliveryPipelineMetadata
     * @memberof cloud-foundry.model.application
     * @description Update the pipeline metadata for the application
     * @param {string} cnsiGuid - guid of the cnsi of the pipeline
     * @param {boolean} refresh - indicates if cached hce metadata should be refreshed
     * @returns {promise} A promise object
     * @public
     */
    function updateDeliveryPipelineMetadata(cnsiGuid, refresh) {
      var application = modelManager.retrieve('cloud-foundry.model.application').application;
      var pipeline = application.pipeline;
      if (refresh) {
        hceServiceInfo = undefined;
      }
      // Retrieve dynamicllay as this model may load before the one we need
      var hcfUserProvidedServiceInstanceModel = modelManager.retrieve('cloud-foundry.model.user-provided-service-instance');
      // Async: work out if this application has a delivery pipeline
      // Look at the services for one named 'hce-<APP_GUID>'
      var hceServiceLink = 'hce-' + application.summary.guid;
      var hceServiceData = _.find(application.summary.services, function (svc) {
        return svc.name === hceServiceLink;
      });

      function clearDeliveryPipelineMetadata(metadata) {
        metadata.fetching = false;
        metadata.valid = false;
        metadata.hceCnsi = undefined;
        metadata.hce_api_url = undefined;
        metadata.hceServiceGuid = undefined;
        metadata.projectId = undefined;
        // Ensure all traces of the project are removed
        application.project = null;
      }

      var promise;
      if (hceServiceData) {
        // Go fetch the service metadata
        promise = hcfUserProvidedServiceInstanceModel.getUserProvidedServiceInstance(cnsiGuid, hceServiceData.guid)
          .then(function (data) {
            // Now we need to see if the CNSI is known
            if (data && data.entity && data.entity.credentials && data.entity.credentials.hce_api_url) {
              // HCE API Endpoint
              pipeline.hceServiceGuid = hceServiceData.guid;
              pipeline.hce_api_url = data.entity.credentials.hce_api_url;
              pipeline.projectId = _.toNumber(data.entity.credentials.hce_pipeline_id);
              return listHceCnsis().then(function (hceEndpoints) {
                var hceInstance = _.find(hceEndpoints, function (hce) {
                  var url = hce.info ? hce.info.api_public_uri : hce.api_endpoint.Scheme + '://' + hce.api_endpoint.Host;
                  return pipeline.hce_api_url.indexOf(url) === 0;
                });
                pipeline.hceCnsi = hceInstance;
                pipeline.valid = angular.isDefined(hceInstance);
                pipeline.fetching = false;
                return pipeline;
              });
            } else {
              clearDeliveryPipelineMetadata(pipeline);
            }
          })
          .catch(function () {
            clearDeliveryPipelineMetadata(pipeline);
          });
      } else {
        clearDeliveryPipelineMetadata(pipeline);
        promise = $q.when(pipeline);
      }

      return promise.then(function (responce) {
        return _onUpdateDeliveryPipelineMetadata(responce);
      });
    }

    /**
     * @function onUpdateDeliveryPipelineMetadata
     * @description Set project when delivery pipeline metadata is updated
     * @param {object} pipeline - the delivery pipeline data
     * @returns {void}
     * @private
     */
    function _onUpdateDeliveryPipelineMetadata(pipeline) {
      var application = modelManager.retrieve('cloud-foundry.model.application').application;
      var hceModel = modelManager.retrieve('code-engine.model.hce');
      if (pipeline && pipeline.valid) {
        hceCnsi = pipeline.hceCnsi;
        return hceModel.getProject(hceCnsi.guid, pipeline.projectId)
          .then(function (response) {
            pipeline.forbidden = false;
            var project = response.data;
            if (!_.isNil(project)) {
              // Don't need to fetch VCS data every time if project hasn't changed
              if (_.isNil(application.project) ||
                application.project.id !== project.id) {
                return hceModel.getVcs(hceCnsi.guid, project.vcs_id)
                  .then(function () {
                    application.project = project;
                  });
              } else {
                application.project = project;
              }
            } else {
              application.project = null;
            }
          })
          .catch(function (response) {
            pipeline.forbidden = response.status === 403;
            pipeline.valid = false;
            application.project = null;
            return $q.reject(response);
          });
      } else {
        application.project = null;
      }
      return $q.resolve();
    }

    function deleteApplicationPipeline() {
      var application = modelManager.retrieve('cloud-foundry.model.application').application;
      if (application.project) {
        var hceModel = modelManager.retrieve('code-engine.model.hce');
        return hceModel.removeProject(application.pipeline.hceCnsi, application.project.id);
      } else if (_.get(application.pipeline, 'forbidden')) {
        // No project due to forbidden request? Ensure we stop the delete chain
        return $q.reject('You do not have permission to delete the associated HCE project');
      } else {
        return $q.resolve();
      }
    }

    /**
     * @function _getUserCnsiModel
     * @description Private method to retrieve user CNSI Model
     * @returns {*|Object}
     * @private
     */
    function _getUserCnsiModel() {
      return modelManager.retrieve('app.model.serviceInstance.user');
    }
  }

})();
