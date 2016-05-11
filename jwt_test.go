package main

import "testing"

func TestGetUserTokenInfo(t *testing.T) {
	t.Parallel()
	_, err := getUserTokenInfo(mockUAAToken)
	if err != nil {
		t.Errorf("Unable to get user token info: %v", err)
	}
}

func TestGetUserTokenInfoNonsenseToken(t *testing.T) {
	t.Parallel()
	_, err := getUserTokenInfo("not a valid token, yo")
	if err == nil {
		t.Error("Should not get user token info from invalid token")
	}
}

func TestGetUserTokenInfoBadToken(t *testing.T) {
	t.Parallel()
	_, err := getUserTokenInfo("this.will.notworkeither")
	if err == nil {
		t.Error("Should not get user token info from invalid token")
	}
}
