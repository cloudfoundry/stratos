(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics')
    .factory('control-plane.metrics.metrics-data-service', metricsDataServiceFactory);

  metricsDataServiceFactory.$inject = [
    'app.event.eventService',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm',
    '$interval',
    '$interpolate',
    '$rootScope',
    '$window',
    '$log',
    '$document'
  ];

  function metricsDataServiceFactory(eventService, modelManager, confirmDialog,
                                     $interval, $interpolate, $rootScope, $window, $log, $document) {


    // model information
    var model = modelManager.retrieve('cloud-foundry.model.application');
    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var metricsData = {};
    var sortFilters = {};


    function fetchComputeNodes(controlPlaneGuid) {
      var controlPlaneModel = modelManager.retrieve('control-plane.model');
      return controlPlaneModel.getComputeNodes(controlPlaneGuid)
        .then(function (nodes) {

          if (!_.has(model, controlPlaneGuid)) {
            metricsData[controlPlaneGuid] = {};

          }
          metricsData[controlPlaneGuid].nodes = nodes;

          // hack for dev-harness
          _.each(nodes, function (node) {
            if (node.spec.hostname === '192.168.200.2') {
              node.spec.hostname = 'kubernetes-master';
            }
            if (node.spec.hostname === '192.168.200.3') {
              node.spec.hostname = 'kubernetes-node';
            }
          });

          metricsData[controlPlaneGuid].kubernetesNodes = _.filter(nodes, function (node) {
            return node.spec.profile !== 'gluster';
          });


        });
    }

    function getNodes(controlPlaneGuid, getKubernetesNodes) {

      if (getKubernetesNodes) {
        return metricsData[controlPlaneGuid].kubernetesNodes
      } else {
        return metricsData[controlPlaneGuid].nodes;
      }
      // failure case
    }

    function setSortFilters(group, filters, defaultFilter) {

      if (_.has(sortFilters, group)) {
      } else {
        sortFilters[group] = {
          filters: filters,
          currentFilter: defaultFilter
        };
      }
    }

    function getCurrentSortFilter(group) {
      return sortFilters[group].currentFilter;
    }

    function getSortFilters(group) {
      return sortFilters[group].filters;
    }

    function setCurrentSortFilter(group, value) {
      sortFilters[group].currentFilter = value;
    }

    function addNodeMetric(controlPlaneGuid, hostname, metricName, filter) {
      return metricsModel.getLatestMetricDataPoint(metricName, filter)
        .then(function (value) {

          // var node = _.find(model[controlPlaneGuid].nodes, function(node){
          //
          // })

        })
    }

    return {
      fetchComputeNodes: fetchComputeNodes,
      getNodes: getNodes,
      metricsData: metricsData,
      setSortFilters: setSortFilters,
      getCurrentSortFilter: getCurrentSortFilter,
      getSortFilters: getSortFilters,
      setCurrentSortFilter: setCurrentSortFilter,
      addNodeMetric: addNodeMetric
    };

  }

})();
