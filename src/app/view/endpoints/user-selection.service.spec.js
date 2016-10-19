(function () {
  'use strict';

  fdescribe('endpoints user selection', function () {

    var $httpBackend, usersSelection;

    var clusterGuid = 'guid';
    var clusterGuid2 = 'guid2';
    var users = [
      {
        metadata: {
          guid: 'userAGuid'
        },
        entity: {
          username: 'userA'
        }
      },
      {
        metadata: {
          guid: 'userBGuid'
        },
        entity: {
          username: 'userB'
        }
      }
    ];

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      usersSelection = $injector.get('app.view.userSelection');
      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('basic selection', function () {
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual({});

      usersSelection.selectUsers(clusterGuid, [ users[0] ]);

      var selectedUsers = _.set({}, users[0].metadata.guid, true);
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(selectedUsers);
    });

    it('basic selection - ignore users with no name', function () {
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual({});

      var userClone = _.cloneDeep(users[0]);
      delete userClone.entity.username;
      usersSelection.selectUsers(clusterGuid, [ userClone ]);

      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual({});
    });

    it('isAllSelected', function () {
      expect(usersSelection.isAllSelected(clusterGuid, [ users[0]])).toBeFalsy();

      usersSelection.selectUsers(clusterGuid, [ users[0] ]);
      expect(usersSelection.isAllSelected(clusterGuid, [ users[0]])).toBeTruthy();

      usersSelection.deselectUsers(clusterGuid, [ users[0] ]);
      expect(usersSelection.isAllSelected(clusterGuid, [ users[0]])).toBeFalsy();
    });

    it('isAllSelected - ignore users with no name', function () {
      expect(usersSelection.isAllSelected(clusterGuid, [users[0]])).toBeFalsy();

      usersSelection.selectUsers(clusterGuid, [users[0]]);
      usersSelection.selectUsers(clusterGuid, [users[1]]);
      expect(usersSelection.isAllSelected(clusterGuid, users)).toBeTruthy();
      usersSelection.deselectUsers(clusterGuid, [users[1]]);
      expect(usersSelection.isAllSelected(clusterGuid, users)).toBeFalsy();

      var userClone = _.cloneDeep(users[1]);
      delete userClone.entity.username;
      expect(usersSelection.isAllSelected(clusterGuid, [users[0], userClone])).toBeTruthy();
    });

    it('deselectUsers', function () {
      usersSelection.selectUsers(clusterGuid, [ users[0] ]);
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(_.set({}, users[0].metadata.guid, true));
      usersSelection.selectUsers(clusterGuid2, [ users[1] ]);
      expect(usersSelection.getSelectedUsers(clusterGuid2)).toEqual(_.set({}, users[1].metadata.guid, true));

      usersSelection.deselectUsers(clusterGuid, users[0]);

      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual({});
      expect(usersSelection.getSelectedUsers(clusterGuid2)).toEqual(_.set({}, users[1].metadata.guid, true));
    });

    it('deselectUsers - ignore users with no username', function () {
      usersSelection.selectUsers(clusterGuid, [ users[0] ]);
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(_.set({}, users[0].metadata.guid, true));

      usersSelection.selectUsers(clusterGuid2, [ users[1] ]);
      expect(usersSelection.getSelectedUsers(clusterGuid2)).toEqual(_.set({}, users[1].metadata.guid, true));

      var userClone = _.cloneDeep(users[0]);
      delete userClone.entity.username;

      usersSelection.deselectUsers(clusterGuid, userClone);

      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(_.set({}, users[0].metadata.guid, true));
      expect(usersSelection.getSelectedUsers(clusterGuid2)).toEqual(_.set({}, users[1].metadata.guid, true));
    });

    it('deselectAllUsers', function () {
      usersSelection.selectUsers(clusterGuid, [ users[0] ]);
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(_.set({}, users[0].metadata.guid, true));

      usersSelection.selectUsers(clusterGuid2, [ users[1] ]);
      expect(usersSelection.getSelectedUsers(clusterGuid2)).toEqual(_.set({}, users[1].metadata.guid, true));

      usersSelection.deselectAllUsers(clusterGuid);

      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual({});
      expect(usersSelection.getSelectedUsers(clusterGuid2)).toEqual(_.set({}, users[1].metadata.guid, true));
    });

    it('deselectInvisibleUsers', function () {
      usersSelection.selectUsers(clusterGuid, [ users[0] ]);
      usersSelection.selectUsers(clusterGuid, [ users[1] ]);

      var selectedUsers = {};
      _.set(selectedUsers, users[0].metadata.guid, true);
      _.set(selectedUsers, users[1].metadata.guid, true);
      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(selectedUsers);

      usersSelection.deselectInvisibleUsers(clusterGuid, [ users[0] ]);

      expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(_.set({}, users[0].metadata.guid, true));
      // expect(usersSelection.getSelectedUsers(clusterGuid)).toEqual(_.set({}, users[1].metadata.guid, false));
    });

  });

})();
