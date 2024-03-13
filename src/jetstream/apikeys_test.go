package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api/config"
	mock_api "github.com/cloudfoundry-incubator/stratos/src/jetstream/api/mock"
	mock_apikeys "github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/apikeys/mock"
	"github.com/golang/mock/gomock"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	. "github.com/smartystreets/goconvey/convey"
)

func Test_addAPIKey(t *testing.T) {
	t.Parallel()

	// disabling logging noise
	log.SetLevel(log.PanicLevel)

	Convey("Given a request to add an API key", t, func() {
		userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

		ctrl := gomock.NewController(t)
		mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
		pp := makeMockServer(mockAPIRepo, mockStratosAuth)
		defer ctrl.Finish()
		defer pp.DatabaseConnectionPool.Close()

		Convey("when API keys are disabled", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.Disabled

			Convey("when API key comment is present", func() {
				comment := "Test API key"
				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": comment})
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusForbidden, "API keys are disabled"))
				})
			})
		})

		Convey("when API keys are enabled for admin users", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.AdminOnly

			Convey("when a StratosAuth error occurs", func() {
				comment := "Test API key"
				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": comment})
				ctx.Set("user_id", userID)

				mockStratosAuth.
					EXPECT().
					GetUser(gomock.Eq(userID)).
					Return(nil, errors.New("Something went wrong"))

				err := pp.addAPIKey(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusForbidden, "Something went wrong"))
				})
			})

			Convey("when user is not an admin", func() {
				Convey("when API key comment is present", func() {
					comment := "Test API key"
					ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": comment})
					ctx.Set("user_id", userID)

					connectedUser := &api.ConnectedUser{
						GUID:  userID,
						Admin: false,
					}

					mockStratosAuth.
						EXPECT().
						GetUser(gomock.Eq(userID)).
						Return(connectedUser, nil)

					err := pp.addAPIKey(ctx)

					Convey("should return an error", func() {
						So(err, ShouldResemble, echo.NewHTTPError(http.StatusForbidden, "API keys are disabled for non-admin users"))
					})
				})
			})

			Convey("when user is an admin", func() {
				Convey("when API key comment is present", func() {
					comment := "Test API key"
					retval := api.APIKey{UserGUID: userID, Comment: comment}

					ctx, rec := makeNewRequestWithParams("POST", map[string]string{"comment": comment})
					ctx.Set("user_id", userID)

					connectedUser := &api.ConnectedUser{
						GUID:  userID,
						Admin: true,
					}

					mockStratosAuth.
						EXPECT().
						GetUser(gomock.Eq(userID)).
						Return(connectedUser, nil)

					mockAPIRepo.
						EXPECT().
						AddAPIKey(gomock.Eq(userID), gomock.Eq(comment)).
						Return(&retval, nil)

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
		})

		Convey("when API keys are enabled", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.AllUsers

			Convey("when comment is not specified", func() {
				ctx, _ := makeNewRequest()
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "Comment can't be empty"))
				})
			})

			Convey("when a DB error occurs", func() {
				comment := "Test API key"

				mockAPIRepo.
					EXPECT().
					AddAPIKey(gomock.Eq(userID), gomock.Eq(comment)).
					Return(nil, errors.New("Something went wrong"))

				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": comment})
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, errors.New("Error adding API key"))
				})
			})

			Convey("when API key comment is present", func() {
				comment := "Test API key"
				retval := api.APIKey{UserGUID: userID, Comment: comment}

				mockAPIRepo.
					EXPECT().
					AddAPIKey(gomock.Eq(userID), gomock.Eq(comment)).
					Return(&retval, nil)

				ctx, rec := makeNewRequestWithParams("POST", map[string]string{"comment": comment})
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
	})
}

func Test_listAPIKeys(t *testing.T) {
	t.Parallel()

	// disabling logging noise
	log.SetLevel(log.PanicLevel)

	ctrl := gomock.NewController(t)
	mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
	mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
	pp := makeMockServer(mockAPIRepo, mockStratosAuth)
	defer ctrl.Finish()
	defer pp.DatabaseConnectionPool.Close()

	Convey("Given a request to list API keys", t, func() {
		userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

		Convey("When API keys are disabled", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.Disabled

			ctx, _ := makeNewRequest()
			ctx.Set("user_id", userID)

			err := pp.listAPIKeys(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, echo.NewHTTPError(http.StatusForbidden, "API keys are disabled"))
			})
		})

		Convey("When API keys are enabled", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.AllUsers

			Convey("when a DB error occurs", func() {
				mockAPIRepo.
					EXPECT().
					ListAPIKeys(gomock.Eq(userID)).
					Return(nil, errors.New("Something went wrong"))

				ctx, _ := makeNewRequest()
				ctx.Set("user_id", userID)

				err := pp.listAPIKeys(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, errors.New("Error listing API keys"))
				})
			})

			Convey("when DB no errors occur", func() {
				r1 := &api.APIKey{
					GUID:     "00000000-0000-0000-0000-000000000000",
					Secret:   "",
					UserGUID: userID,
					Comment:  "First key",
					LastUsed: nil,
				}

				r2 := &api.APIKey{
					GUID:     "11111111-1111-1111-1111-111111111111",
					Secret:   "",
					UserGUID: userID,
					Comment:  "Second key",
					LastUsed: nil,
				}

				retval := []api.APIKey{*r1, *r2}

				mockAPIRepo.
					EXPECT().
					ListAPIKeys(gomock.Eq(userID)).
					Return(retval, nil)

				ctx, rec := makeNewRequest()
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
	})
}

func Test_deleteAPIKeys(t *testing.T) {
	t.Parallel()

	// disabling logging noise
	log.SetLevel(log.PanicLevel)

	ctrl := gomock.NewController(t)
	mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
	mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
	pp := makeMockServer(mockAPIRepo, mockStratosAuth)
	defer ctrl.Finish()
	defer pp.DatabaseConnectionPool.Close()

	userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	keyID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

	Convey("Given a request to delete an API key", t, func() {
		Convey("when API keys are disabled", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.Disabled

			ctx, _ := makeNewRequestWithParams("POST", map[string]string{"guid": keyID})
			ctx.Set("user_id", userID)

			err := pp.deleteAPIKey(ctx)

			Convey("should return an error", func() {
				So(err, ShouldResemble, echo.NewHTTPError(http.StatusForbidden, "API keys are disabled"))
			})
		})

		Convey("when API keys are enabled", func() {
			pp.Config.APIKeysEnabled = config.APIKeysConfigEnum.AllUsers

			Convey("when no API key GUID is supplied", func() {
				ctx, _ := makeNewRequest()
				ctx.Set("user_id", userID)

				err := pp.deleteAPIKey(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "API key guid can't be empty"))
				})
			})

			Convey("when an error occured during API key deletion", func() {
				mockAPIRepo.
					EXPECT().
					DeleteAPIKey(gomock.Eq(userID), gomock.Eq(keyID)).
					Return(errors.New("Something went wrong"))

				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"guid": keyID})
				ctx.Set("user_id", userID)

				err := pp.deleteAPIKey(ctx)

				Convey("should return an error", func() {
					So(err, ShouldResemble, errors.New("Error deleting API key"))
				})
			})

			Convey("when an API key is deleted succesfully", func() {
				mockAPIRepo.
					EXPECT().
					DeleteAPIKey(gomock.Eq(userID), gomock.Eq(keyID)).
					Return(nil)

				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"guid": keyID})
				ctx.Set("user_id", userID)

				err := pp.deleteAPIKey(ctx)

				Convey("there should be no error", func() {
					So(err, ShouldBeNil)
				})
			})
		})
	})
}
