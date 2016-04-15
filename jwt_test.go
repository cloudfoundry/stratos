package main

import "testing"

func TestGetUserTokenInfo(t *testing.T) {
	_, err := getUserTokenInfo(mockUaaToken)
	if err != nil {
		t.Errorf("Unable to get user token info: %v", err)
	}
}

func TestGetUserTokenInfoNonsenseToken(t *testing.T) {
	_, err := getUserTokenInfo("not a valid token, yo")
	if err == nil {
		t.Error("Should not get user token info from invalid token")
	}
}

func TestGetUserTokenInfoBadToken(t *testing.T) {
	_, err := getUserTokenInfo("this.will.notworkeither")
	if err == nil {
		t.Error("Should not get user token info from invalid token")
	}
}
