package main

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/api/config"
	mock_api "github.com/cloudfoundry/stratos/src/jetstream/api/mock"
	mock_apikeys "github.com/cloudfoundry/stratos/src/jetstream/repository/apikeys/mock"
	"github.com/labstack/echo/v5"
	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/mock/gomock"
)

func Test_addAPIKey(t *testing.T) {
	t.Parallel()

	// disabling logging noise
	slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))

	Convey("Given a request to add an API key", t, func() {
		userID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

		ctrl := gomock.NewController(t)
		mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
		mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
		pp := makeMockServer(mockAPIRepo, mockStratosAuth)
		defer ctrl.Finish()
		defer func() { _ = pp.DatabaseConnectionPool.Close() }()

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
						AddAPIKey(gomock.Eq(userID), gomock.Eq(comment), gomock.Nil()).
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

			Convey("when the expiry is in the past", func() {
				ctx, _ := makeNewRequestWithParams("POST", map[string]string{
					"comment":    "Test API key",
					"expires_at": time.Now().Add(-24 * time.Hour).UTC().Format(time.RFC3339),
				})
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("should return a 400 error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "Expiry must be in the future"))
				})
			})

			Convey("when the expiry is after 2038-01-19T03:14:07Z", func() {
				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": "Test API key", "expires_at": "2038-01-19T03:14:08Z"})
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("should return a 400 error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "Expiry must be before 19 January 2038"))
				})
			})

			Convey("when the expiry carries a UTC offset", func() {
				comment := "Test API key"
				local := time.Now().Add(48 * time.Hour).In(time.FixedZone("", 2*3600)).Truncate(time.Second)
				expiry := local.UTC()

				mockAPIRepo.
					EXPECT().
					AddAPIKey(gomock.Eq(userID), gomock.Eq(comment), gomock.Any()).
					DoAndReturn(func(_, _ string, got *time.Time) (*api.APIKey, error) {
						if got.Location() != time.UTC || !got.Equal(expiry) {
							t.Errorf("AddAPIKey got %v, want UTC instant %v", got, expiry)
						}
						return &api.APIKey{UserGUID: userID, Comment: comment, ExpiresAt: got}, nil
					})

				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": comment, "expires_at": local.Format(time.RFC3339)})
				ctx.Set("user_id", userID)

				Convey("the repository receives the UTC instant", func() {
					So(pp.addAPIKey(ctx), ShouldBeNil)
				})
			})

			Convey("when the expiry is not a time", func() {
				ctx, _ := makeNewRequestWithParams("POST", map[string]string{"comment": "Test API key", "expires_at": "soon"})
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("should return a 400 error", func() {
					So(err, ShouldResemble, echo.NewHTTPError(http.StatusBadRequest, "Expiry must be an RFC 3339 time"))
				})
			})

			Convey("when the expiry is in the future", func() {
				comment := "Test API key"
				expiry := time.Now().Add(24 * time.Hour).UTC().Truncate(time.Second)
				retval := api.APIKey{UserGUID: userID, Comment: comment, ExpiresAt: &expiry}

				mockAPIRepo.
					EXPECT().
					AddAPIKey(gomock.Eq(userID), gomock.Eq(comment), gomock.Eq(&expiry)).
					Return(&retval, nil)

				ctx, rec := makeNewRequestWithParams("POST", map[string]string{
					"comment":    comment,
					"expires_at": expiry.Format(time.RFC3339),
				})
				ctx.Set("user_id", userID)

				err := pp.addAPIKey(ctx)

				Convey("the key is created with that expiry", func() {
					So(err, ShouldBeNil)
					So(rec.Code, ShouldEqual, 200)
					So(rec.Body.String(), ShouldContainSubstring, `"expires_at":"`+expiry.Format(time.RFC3339))
				})
			})

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
					AddAPIKey(gomock.Eq(userID), gomock.Eq(comment), gomock.Nil()).
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
					AddAPIKey(gomock.Eq(userID), gomock.Eq(comment), gomock.Nil()).
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
	slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))

	ctrl := gomock.NewController(t)
	mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
	mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
	pp := makeMockServer(mockAPIRepo, mockStratosAuth)
	defer ctrl.Finish()
	defer func() { _ = pp.DatabaseConnectionPool.Close() }()

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
	slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))

	ctrl := gomock.NewController(t)
	mockAPIRepo := mock_apikeys.NewMockRepository(ctrl)
	mockStratosAuth := mock_api.NewMockStratosAuth(ctrl)
	pp := makeMockServer(mockAPIRepo, mockStratosAuth)
	defer ctrl.Finish()
	defer func() { _ = pp.DatabaseConnectionPool.Close() }()

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
