package main

import (
	"net/http"
	"strings"
	"testing"
)

func TestLoginToCNSI(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGuid,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockCNSI = cnsiRecord{
		Name:                  "mockHCF",
		CNSIType:              cnsiHCF,
		AuthorizationEndpoint: mockUAA.URL,
	}
	pp.CNSIs[mockCNSIGuid] = mockCNSI

	if err := pp.loginToCNSI(ctx); err != nil {
		t.Error(err)
	}

	testTokenKey := mkTokenRecordKey(mockCNSIGuid, mockUserGuid)
	if _, ok := pp.CNSITokenMap[testTokenKey]; !ok {
		t.Errorf("Token was not saved in CNSI map")
	}
}

func TestLoginToCNSIWithMissingCNSI(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"username": "admin",
		"password": "changeme",
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockCNSI = cnsiRecord{
		Name:                  "mockHCF",
		CNSIType:              cnsiHCF,
		AuthorizationEndpoint: mockUAA.URL,
	}
	pp.CNSIs[mockCNSIGuid] = mockCNSI

	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Login should fail if CNSI not specified")
	}

	testTokenKey := mkTokenRecordKey("", mockUserGuid)
	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
		t.Error("Token should not be saved in CNSI map if CNSI is not specified")
	}
}

func TestLoginToCNSIWithMissingCreds(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"cnsi_guid": mockCNSIGuid,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockCNSI = cnsiRecord{
		Name:                  "mockHCF",
		CNSIType:              cnsiHCF,
		AuthorizationEndpoint: mockUAA.URL,
	}
	pp.CNSIs[mockCNSIGuid] = mockCNSI

	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Login against CNSI should fail if creds not specified")
	}

	testTokenKey := mkTokenRecordKey("", mockUserGuid)
	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
		t.Error("Token should not be saved in CNSI map if creds not specified")
	}
}

func TestLoginToCNSIWithMissingAPIEndpoint(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGuid,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockCNSI = cnsiRecord{
		Name:     "mockHCF",
		CNSIType: cnsiHCF,
	}
	pp.CNSIs[mockCNSIGuid] = mockCNSI

	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Login against CNSI should fail if API endpoint not specified")
	}

	testTokenKey := mkTokenRecordKey("", mockUserGuid)
	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
		t.Error("Token should not be saved in CNSI map if API endpoint not specified")
	}
}

func TestLoginToCNSIWithBadCreds(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"username":  "admin",
		"password":  "busted",
		"cnsi_guid": mockCNSIGuid,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockCNSI = cnsiRecord{
		Name:                  "mockHCF",
		CNSIType:              cnsiHCF,
		AuthorizationEndpoint: mockUAA.URL,
	}
	pp.CNSIs[mockCNSIGuid] = mockCNSI

	if err := pp.loginToCNSI(ctx); err != nil {
		t.Error(err)
	}

	testTokenKey := mkTokenRecordKey(mockCNSIGuid, mockUserGuid)
	if _, ok := pp.CNSITokenMap[testTokenKey]; !ok {
		t.Errorf("Token was not saved in CNSI map")
	}
}

func TestLoginToUAA(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"username": "admin",
		"password": "changeme",
	})

	res, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()
	pp.Config.UAAEndpoint = mockUAA.URL + "/oauth/token"

	if err := pp.loginToUAA(ctx); err != nil {
		t.Error(err)
	}

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if !strings.HasPrefix(string(setCookie), "portal-session=") {
		t.Errorf("Session was not set: %v", setCookie)
	}

	if _, ok := pp.UAATokenMap[mockUserGuid]; !ok {
		t.Errorf("Token was not saved in UAA map")
	}
}

func TestLoginToUAAWithBadCreds(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
		"username": "admin",
		"password": "busted",
	})

	res, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusUnauthorized),
	)

	defer mockUAA.Close()
	pp.Config.UAAEndpoint = mockUAA.URL + "/oauth/token"

	err := pp.loginToUAA(ctx)
	if err == nil {
		t.Error("Should not have been able to log in with incorrect credentials")
	}

	someErr := err.(errHTTPShadow)
	if someErr.HTTPError.Code != http.StatusUnauthorized {
		t.Error("Status was wrong on invalid auth attempt:", someErr.HTTPError.Code)
	}

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if strings.HasPrefix(string(setCookie), "portal-session=") {
		t.Errorf("Session should not be set with invalid creds: %v", setCookie)
	}

	testTokenKey := mkTokenRecordKey(mockCNSIGuid, mockUserGuid)
	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
		t.Errorf("Token should not be saved in CNSI map with invalid creds")
	}
}

func TestLogout(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{})

	res, _, ctx, pp := setupHTTPTest(req)

	pp.logout(ctx)

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if strings.HasPrefix(string(setCookie), "portal-session=") && !strings.HasPrefix(string(setCookie), "portal-session=; Max-Age=0") {
		t.Errorf("Session should not exist after logout: %v", setCookie)
	}
}
