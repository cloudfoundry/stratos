(function (mock) {
  'use strict';

  mock.hceApi = mock.hceApi || {};

  mock.hceApi.HceNotificationApi = {

    getNotificationTargets: function (id) {
      return {
        url: '/pp/v1/proxy/v2/notifications/targets?project_id=' + id,
        response: {
          200: [{id: id, name: 'test', token: '5c42437c', type: 'slack', location: 'test', createdDate: null}],
          500: {
            body: {}
          }
        }
      };
    },
    getNotificationTargetTypes: function () {
      return {
        url: '/pp/v1/proxy/v2/notifications/targets/types',
        response: {
          200: [{
            item_id: 0,
            enum_type: 'notification',
            item_label: 'httpPost',
            item_value: 'httpPost'
          }, {
            item_id: 1,
            enum_type: 'notification',
            item_label: 'githubpullrequest',
            item_value: 'githubpullrequest'
          }, {
            item_id: 2,
            enum_type: 'notification',
            item_label: 'bitbucketpullrequest',
            item_value: 'bitbucketpullrequest'
          }, {
            item_id: 3,
            enum_type: 'notification',
            item_label: 'hipchat',
            item_value: 'hipchat'
          }, {
            item_id: 4,
            enum_type: 'notification',
            item_label: 'flowdock',
            item_value: 'flowdock'
          }, {
            item_id: 5,
            enum_type: 'notification',
            item_label: 'slack', item_value: 'slack'
          }],
          500: {
            body: {}
          }
        }
      };
    }
  };

})(this.mock = this.mock || {});
