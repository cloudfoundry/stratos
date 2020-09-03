package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/golang/mock/gomock"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
	. "github.com/smartystreets/goconvey/convey"
)

func Test_addAPIKey(t *testing.T) {
	t.Parallel()

	Convey("Given a request to add an API key", t, func() {
		log.SetLevel(log.WarnLevel)

		userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

		Convey("when comment is not specified", func() {
			req := setupMockReq("POST", "", map[string]string{})

			_, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()

			ctx.Set("user_id", userID)

			err := pp.addAPIKey(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "Comment can't be empty"))
			})
		})

		Convey("when a DB error occurs", func() {
			comment := "Test API key"

			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			m := apikeys.NewMockRepository(ctrl)
			m.
				EXPECT().
				AddAPIKey(gomock.Eq(userID), gomock.Eq(comment)).
				Return(nil, errors.New("Something went wrong"))

			req := setupMockReq("POST", "", map[string]string{
				"comment": comment,
			})

			_, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()

			pp.APIKeysRepository = m

			ctx.Set("user_id", userID)

			err := pp.addAPIKey(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, errors.New("Error adding API key"))
			})
		})

		Convey("when API key comment was added successfully", func() {
			comment := "Test API key"
			retval := interfaces.APIKey{UserGUID: userID, Comment: comment}

			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			m := apikeys.NewMockRepository(ctrl)
			m.
				EXPECT().
				AddAPIKey(gomock.Eq(userID), gomock.Eq(comment)).
				Return(&retval, nil)

			req := setupMockReq("POST", "", map[string]string{
				"comment": comment,
			})

			rec, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()

			pp.APIKeysRepository = m

			ctx.Set("user_id", userID)

			err := pp.addAPIKey(ctx)

			var data map[string]interface{}
			if jsonErr := json.Unmarshal(rec.Body.Bytes(), &data); jsonErr != nil {
				panic(jsonErr)
			}

			Convey("there should be no error", func() {
				So(err, ShouldBeNil)
			})

			Convey("should return HTTP code 200", func() {
				So(rec.Code, ShouldEqual, 200)
			})

			Convey("API key user_guid should equal context user", func() {
				So(data["user_guid"], ShouldEqual, userID)
			})

			Convey("API key comment should equal request comment", func() {
				So(data["comment"], ShouldEqual, comment)
			})

			Convey("API key last_used should be nil", func() {
				So(data["last_used"], ShouldBeNil)
			})
		})

	})
}

func Test_listAPIKeys(t *testing.T) {
	t.Parallel()

	Convey("Given a request to list API keys", t, func() {
		log.SetLevel(log.WarnLevel)

		userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

		Convey("when a DB error occurs", func() {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			m := apikeys.NewMockRepository(ctrl)
			m.
				EXPECT().
				ListAPIKeys(gomock.Eq(userID)).
				Return(nil, errors.New("Something went wrong"))

			req := setupMockReq("GET", "", map[string]string{})

			_, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()
			pp.APIKeysRepository = m

			ctx.Set("user_id", userID)

			err := pp.listAPIKeys(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, errors.New("Error listing API keys"))
			})
		})

		Convey("when DB no errors occur", func() {
			r1 := &interfaces.APIKey{
				GUID:     "00000000-0000-0000-0000-000000000000",
				Secret:   "",
				UserGUID: userID,
				Comment:  "First key",
				LastUsed: nil,
			}

			r2 := &interfaces.APIKey{
				GUID:     "11111111-1111-1111-1111-111111111111",
				Secret:   "",
				UserGUID: userID,
				Comment:  "Second key",
				LastUsed: nil,
			}

			retval := []interfaces.APIKey{*r1, *r2}

			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			m := apikeys.NewMockRepository(ctrl)
			m.
				EXPECT().
				ListAPIKeys(gomock.Eq(userID)).
				Return(retval, nil)

			req := setupMockReq("GET", "", map[string]string{})

			rec, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()
			pp.APIKeysRepository = m

			ctx.Set("user_id", userID)

			err := pp.listAPIKeys(ctx)

			Convey("there should be no error", func() {
				So(err, ShouldBeNil)
			})

			Convey("return valid JSON", func() {
				So(rec.Body.String(), ShouldEqual, jsonMust(retval)+"\n")
			})
		})
	})
}

func Test_deleteAPIKeys(t *testing.T) {
	t.Parallel()

	userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	keyID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

	Convey("Given a request to delete an API key", t, func() {
		log.SetLevel(log.PanicLevel)

		Convey("when no API key GUID is supplied", func() {
			req := setupMockReq("POST", "", map[string]string{
				"guid": "",
			})

			_, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()

			ctx.Set("user_id", userID)

			err := pp.deleteAPIKey(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "API key guid can't be empty"))
			})
		})

		Convey("when an error occured during API key deletion", func() {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			m := apikeys.NewMockRepository(ctrl)
			m.
				EXPECT().
				DeleteAPIKey(gomock.Eq(userID), gomock.Eq(keyID)).
				Return(errors.New("Something went wrong"))

			req := setupMockReq("POST", "", map[string]string{
				"guid": keyID,
			})

			_, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()

			pp.APIKeysRepository = m

			ctx.Set("user_id", userID)

			err := pp.deleteAPIKey(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, errors.New("Error deleting API key"))
			})
		})

		Convey("when an API key is deleted succesfully", func() {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			m := apikeys.NewMockRepository(ctrl)
			m.
				EXPECT().
				DeleteAPIKey(gomock.Eq(userID), gomock.Eq(keyID)).
				Return(nil)

			req := setupMockReq("POST", "", map[string]string{
				"guid": keyID,
			})

			_, _, ctx, pp, db, _ := setupHTTPTest(req)
			defer db.Close()

			pp.APIKeysRepository = m

			ctx.Set("user_id", userID)

			err := pp.deleteAPIKey(ctx)

			Convey("there should be no error", func() {
				So(err, ShouldBeNil)
			})
		})
	})
}
