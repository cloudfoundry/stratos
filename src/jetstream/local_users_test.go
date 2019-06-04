package main

import (
	//"errors"
	// "net/http"
	// "net/url"
	"fmt"
	"testing"
	"time"

	// uuid "github.com/satori/go.uuid"

	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	log "github.com/sirupsen/logrus"

	uuid "github.com/satori/go.uuid"

	// "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/crypto"
	//"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/local_users"
	//"github.com/labstack/echo"
	. "github.com/smartystreets/goconvey/convey"
	
)

const (
	insertLocalUserSQL = `INSERT INTO local_users (user_guid, password_hash, user_name, user_email, user_scope) VALUES ($1, $2, $3, $4, $5)`
)

func TestAddLocalUser(t *testing.T) {
	t.Parallel()

	Convey("Local User tests", t, func() {
		req := setupMockReq("POST", "", map[string]string{
			"username": "testuser",
			"password": "changeme",
			"email":    "test.person@somedomain.com",
			"scope":    "stratos.admin",
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mock.ExpectExec(addLocalUser).WillReturnResult(sqlmock.NewResult(1, 1))

		guid, err := pp.AddLocalUser(ctx)
		
		expectedGUIDRow := sqlmock.NewRows([]string{"user_guid"}).AddRow(guid)

        mock.ExpectQuery(findUserGUID).WillReturnRows(expectedGUIDRow)

		fetchedGUID, err := pp.FindUserGUID(ctx)

		Convey("Should not fail to login", func() {
			So(err, ShouldBeNil)
			So(guid, ShouldEqual, fetchedGUID)
		})
		
		Convey("Expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestAddLocalUserMissingUsername(t *testing.T) {
	t.Parallel()

	Convey("Local User tests", t, func() {
		req := setupMockReq("POST", "", map[string]string{
			"password": "changeme",
			"email":    "test.person@somedomain.com",
			"scope":    "stratos.admin",
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		guid, err := pp.AddLocalUser(ctx)

		Convey("Should fail to login", func() {
			So(err, ShouldNotBeNil)
			So(guid, ShouldEqual, "")
		})
		
		Convey("Expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestAddLocalUserMissingPassword(t *testing.T) {
	t.Parallel()

	Convey("Local User tests", t, func() {
		req := setupMockReq("POST", "", map[string]string{
			"username": "testuser",
			"email":    "test.person@somedomain.com",
			"scope":    "stratos.admin",
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		guid, err := pp.AddLocalUser(ctx)

		Convey("Should fail to login", func() {
			So(err, ShouldNotBeNil)
			So(guid, ShouldEqual, "")
		})
		
		Convey("Expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestAddLocalUserDuplicate(t *testing.T) {
	t.Parallel()

	Convey("Local User tests", t, func() {
		req := setupMockReq("POST", "", map[string]string{
			"username": "testuser",
			"password": "changeme",
			"email":    "test.person@somedomain.com",
			"scope":    "stratos.admin",
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mock.ExpectExec(addLocalUser).WillReturnResult(sqlmock.NewResult(1, 1))

		guid, err := pp.AddLocalUser(ctx)

		expectedGUIDRow := sqlmock.NewRows([]string{"user_guid"}).AddRow(guid)

		mock.ExpectQuery(findUserGUID).WillReturnRows(expectedGUIDRow)
		
		fetchedGUID, err := pp.FindUserGUID(ctx)

		Convey("Should not fail add user", func() {
			So(err, ShouldBeNil)
			So(guid, ShouldEqual, fetchedGUID)
		})

		req = setupMockReq("POST", "", map[string]string{
			"username": "testuser",
			"password": "changeme",
			"email":    "test.person@somedomain.com",
			"scope":    "stratos.admin",
		})

		mock.ExpectExec(addLocalUser).WillReturnError(fmt.Errorf(""))

		guid, err = pp.AddLocalUser(ctx)
		Convey("Should fail to add user", func() {
			So(err, ShouldNotBeNil)
			So(err.Error(), ShouldContainSubstring, "Unable to INSERT local user")
			So(guid, ShouldEqual, "")
		})

		Convey("Expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestFindPasswordHash(t *testing.T) {
	t.Parallel()

	Convey("Local User tests", t, func() {
		db, mock, _ := sqlmock.New()

		defer db.Close()

		pp := setupPortalProxy(db)
		pp.DatabaseConnectionPool = db

		localUsersRepo, err := local_users.NewPgsqlLocalUsersRepository(db)
		if err != nil {
			log.Errorf("Database error getting repo for Local users: %v", err)
			panic(err)
		}

		username := "testuser"
		password := "changeme"
		email    := "test.person@somedomain.com"
		scope    := "stratos.admin"
		
		//Hash the password
		generatedPasswordHash, err := pp.HashPassword(password)
		if err != nil {
			log.Errorf("Error hashing user password: %v", err)
			panic(err)
		}

		//generate a user GUID
		userGUID := uuid.NewV4().String()

		mock.ExpectExec(addLocalUser).WillReturnResult(sqlmock.NewResult(1, 1))
		err = localUsersRepo.AddLocalUser(userGUID, generatedPasswordHash, username, email, scope)
		if err != nil {
			log.Errorf("Error hashing user password: %v", err)
			panic(err)
		}

		expectedHashRow := sqlmock.NewRows([]string{"password_hash"}).AddRow(generatedPasswordHash)
		mock.ExpectQuery(findPasswordHash).WillReturnRows(expectedHashRow)
		fetchedPasswordHash, err := localUsersRepo.FindPasswordHash(userGUID)

		Convey("Password hashes should match", func() {
			So(fetchedPasswordHash, ShouldResemble, generatedPasswordHash)
		})
		
		Convey("Expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestUpdateLastLoginTime(t *testing.T) {
	t.Parallel()

	Convey("Local User tests", t, func() {
		db, mock, _ := sqlmock.New()

		defer db.Close()

		pp := setupPortalProxy(db)
		pp.DatabaseConnectionPool = db

		localUsersRepo, err := local_users.NewPgsqlLocalUsersRepository(db)
		if err != nil {
			log.Errorf("Database error getting repo for Local users: %v", err)
			panic(err)
		}

		username := "testuser"
		password := "changeme"
		email    := "test.person@somedomain.com"
		scope    := "stratos.admin"
		
		//Hash the password
		generatedPasswordHash, err := pp.HashPassword(password)
		if err != nil {
			log.Errorf("Error hashing user password: %v", err)
			panic(err)
		}

		//generate a user GUID
		userGUID := uuid.NewV4().String()

		mock.ExpectExec(addLocalUser).WillReturnResult(sqlmock.NewResult(1, 1))
		err = localUsersRepo.AddLocalUser(userGUID, generatedPasswordHash, username, email, scope)
		if err != nil {
			log.Errorf("Error hashing user password: %v", err)
			panic(err)
		}

		//Now generate and update the login time
		generatedLoginTime := time.Now()

		mock.ExpectExec(updateLastLoginTime).WillReturnResult(sqlmock.NewResult(1,1))
		localUsersRepo.UpdateLastLoginTime(userGUID, generatedLoginTime)
		
		expectedLastLoginTimeRow := sqlmock.NewRows([]string{"login_time"}).AddRow(generatedLoginTime)
		mock.ExpectQuery(findLastLoginTime).WillReturnRows(expectedLastLoginTimeRow)
		fetchedLoginTime, err := localUsersRepo.FindLastLoginTime(userGUID)
		if err != nil {
			log.Errorf("Error fetching last login time: %v", err)
			panic(err)
		}

		Convey("Login times should match", func() {
			So(fetchedLoginTime, ShouldEqual, generatedLoginTime)
		})
		
		Convey("Expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}