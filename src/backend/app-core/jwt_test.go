package main

import "testing"

func TestGetUserTokenInfo(t *testing.T) {
	t.Parallel()
	pp := setupPortalProxy(nil)
	_, err := pp.GetUserTokenInfo(mockUAAToken)
	if err != nil {
		t.Errorf("Unable to get user token info: %v", err)
	}
}

func TestGetUserTokenInfoNonsenseToken(t *testing.T) {
	t.Parallel()
	pp := setupPortalProxy(nil)
	_, err := pp.GetUserTokenInfo("not a valid token, yo")
	if err == nil {
		t.Error("Should not get user token info from invalid token")
	}
}

func TestGetUserTokenInfoBadToken(t *testing.T) {
	t.Parallel()
	pp := setupPortalProxy(nil)
	_, err := pp.GetUserTokenInfo("this.will.notworkeither")
	if err == nil {
		t.Error("Should not get user token info from invalid token")
	}
}
