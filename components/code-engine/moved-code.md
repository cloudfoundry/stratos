## Moved from auth.go
1. DoLoginTOCNSI
```
	//if cnsiRecord.CNSIType == cnsis.CNSIHCE {
	//	// Get the list VCS clients supported by this Code Engine instance
	//	log.Debug("loginToCNSI (Code Engine), getting list of VCS...")
	//	err := p.autoRegisterCodeEngineVcs(userID, cnsiGUID)
	//	if err != nil {
	//		log.Warnf("loginToCNSI Failed to auto register Code Engine VCS! %#v", err)
	//	}
	//}
 ```

## Moved from cnsi.go
```
  // TODO move to HCE plugin
  //func getHCEInfo(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, error) {
  //	log.Debug("getHCEInfo")
  //	var infoResponse hceInfo
  //	var newCNSI interfaces.CNSIRecord
  //
  //	newCNSI.CNSIType = cnsis.CNSIHCE
  //
  //	uri, err := url.Parse(apiEndpoint)
  //	if err != nil {
  //		return newCNSI, err
  //	}
  //
  //	uri.Path = "info"
  //	h := httpClient
  //	if skipSSLValidation {
  //		h = httpClientSkipSSL
  //	}
  //	res, err := h.Get(uri.String())
  //	if err != nil {
  //		return newCNSI, err
  //	}
  //
  //	if res.StatusCode != 200 {
  //		buf := &bytes.Buffer{}
  //		io.Copy(buf, res.Body)
  //		defer res.Body.Close()
  //
  //		return newCNSI, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
  //	}
  //
  //	dec := json.NewDecoder(res.Body)
  //	if err = dec.Decode(&infoResponse); err != nil {
  //		return newCNSI, err
  //	}
  //
  //	newCNSI.TokenEndpoint = infoResponse.AuthorizationEndpoint
  //	newCNSI.AuthorizationEndpoint = infoResponse.AuthorizationEndpoint
  //
  //	return newCNSI, nil
  //}

```

## HCE tests
```

//func TestRegisterHCECluster(t *testing.T) {
//	t.Parallel()
//	t.Skip("Skip HCE tests")
//
//	mockInfo := setupMockServer(t,
//		msRoute("/info"),
//		msMethod("GET"),
//		msStatus(http.StatusOK),
//		msBody(jsonMust(mockInfoResponse)))
//
//	defer mockInfo.Close()
//
//	req := setupMockReq("POST", "", map[string]string{
//		"cnsi_name":           "Some fancy HCE Cluster",
//		"api_endpoint":        mockInfo.URL,
//		"skip_ssl_validation": "true",
//	})
//
//	_, _, ctx, pp, db, mock := setupHTTPTest(req)
//	defer db.Close()
//
//	mock.ExpectExec(insertIntoCNSIs).
//		WithArgs(sqlmock.AnyArg(), "Some fancy HCE Cluster", "hce", mockInfo.URL, "", "", "", true).
//		WillReturnResult(sqlmock.NewResult(1, 1))
//
//	if err := pp.registerHCECluster(ctx); err != nil {
//		t.Errorf("Failed to register cluster: %v", err)
//	}
//
//	if dberr := mock.ExpectationsWereMet(); dberr != nil {
//		t.Errorf("There were unfulfilled expectations: %s", dberr)
//	}
//}

//func TestRegisterHCEClusterWithMissingName(t *testing.T) {
//	t.Parallel()
//
//	mockInfo := setupMockServer(t,
//		msRoute("/info"),
//		msMethod("GET"),
//		msStatus(http.StatusOK),
//		msBody(jsonMust(mockInfoResponse)))
//
//	defer mockInfo.Close()
//
//	req := setupMockReq("POST", "", map[string]string{
//		"api_endpoint": mockInfo.URL,
//	})
//
//	_, _, ctx, pp, db, _ := setupHTTPTest(req)
//	defer db.Close()
//
//	if err := pp.registerHCECluster(ctx); err == nil {
//		t.Error("Should not be able to register cluster without cluster name")
//	}
//}

//func TestRegisterHCEClusterWithMissingAPIEndpoint(t *testing.T) {
//	t.Parallel()
//
//	mockInfo := setupMockServer(t,
//		msRoute("/info"),
//		msMethod("GET"),
//		msStatus(http.StatusOK),
//		msBody(jsonMust(mockInfoResponse)))
//
//	defer mockInfo.Close()
//
//	req := setupMockReq("POST", "", map[string]string{
//		"cnsi_name": "Some fancy HCE Cluster",
//	})
//
//	_, _, ctx, pp, db, _ := setupHTTPTest(req)
//	defer db.Close()
//
//	if err := pp.registerHCECluster(ctx); err == nil {
//		t.Error("Should not be able to register cluster without api endpoint")
//	}
//}

//func TestRegisterHCEClusterWithInvalidAPIEndpoint(t *testing.T) {
//	t.Parallel()
//
//	mockInfo := setupMockServer(t,
//		msRoute("/info"),
//		msMethod("GET"),
//		msStatus(http.StatusOK),
//		msBody(jsonMust(mockInfoResponse)))
//
//	defer mockInfo.Close()
//
//	// force a bad api_endpoint to be sure it is handled properly:
//	// src: https://bryce.fisher-fleig.org/blog/golang-testing-stdlib-errors/index.html
//	req := setupMockReq("POST", "", map[string]string{
//		"cnsi_name":    "Some fancy HCE Cluster",
//		"api_endpoint": "%zzzzz",
//	})
//
//	_, _, ctx, pp, db, _ := setupHTTPTest(req)
//	defer db.Close()
//
//	if err := pp.registerHCECluster(ctx); err == nil {
//		t.Error("Should not be able to register cluster without a valid api endpoint")
//	}
//}

//func TestRegisterHCEClusterWithBadV2Request(t *testing.T) {
//	t.Skip("TODO: fix this!") // https://jira.hpcloud.net/browse/TEAMFOUR-637
//	t.Parallel()
//
//	mockInfo := setupMockServer(t,
//		msRoute("/info"),
//		msMethod("GET"),
//		msStatus(http.StatusNotFound),
//		msBody(""))
//
//	defer mockInfo.Close()
//
//	req := setupMockReq("POST", "", map[string]string{
//		"cnsi_name":    "Some fancy HCE Cluster",
//		"api_endpoint": mockInfo.URL,
//	})
//
//	_, _, ctx, pp, db, _ := setupHTTPTest(req)
//	defer db.Close()
//
//	if err := pp.registerHCECluster(ctx); err == nil {
//		t.Error("Should not register cluster if call to info fails")
//	}
//}
//
//func TestRegisterHCEClusterButCantSaveCNSIRecord(t *testing.T) {
//	t.Parallel()
//
//	mockInfo := setupMockServer(t,
//		msRoute("/info"),
//		msMethod("GET"),
//		msStatus(http.StatusOK),
//		msBody(jsonMust(mockInfoResponse)))
//
//	defer mockInfo.Close()
//
//	req := setupMockReq("POST", "", map[string]string{
//		"cnsi_name":    "Some fancy HCE Cluster",
//		"api_endpoint": mockInfo.URL,
//	})
//
//	_, _, ctx, pp, db, mock := setupHTTPTest(req)
//	defer db.Close()
//
//	mock.ExpectExec(insertIntoCNSIs).
//		WillReturnError(errors.New("Unknown Database Error"))
//
//	if err := pp.registerHCECluster(ctx); err == nil {
//		t.Errorf("Unexpected success - should not be able to register cluster withot token save.")
//	}
//}


//
//func TestGetHCEInfoWithBadURL(t *testing.T) {
//	t.Parallel()
//
//	 pp.Endpoints["cf"], _ := cf.Init(portalProxy{})
//	invalidEndpoint := "%zzzz"
//	if _, err :=  pp.Endpoints["cf"].Info(invalidEndpoint, true); err == nil {
//		t.Error("getHCEInfo should not return a valid response when the URL is bad.")
//	}
//}
//
//func TestGetHCEInfoWithInvalidEndpoint(t *testing.T) {
//	t.Parallel()
//
//	 pp.Endpoints["cf"], _ := cf.Init(portalProxy{})
//	ep := "http://invalid.net"
//	if _, err :=  pp.Endpoints["cf"].Info(invalidEndpoint, true); err == nil {
//		t.Error("getHCEInfo should not return a valid response when the endpoint is invalid.")
//	}
//}

```
