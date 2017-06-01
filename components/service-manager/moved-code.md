## Move from cnsi.go
```
// TODO: Move to HSM plugin
//func getHSMInfo(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, error) {
//	log.Debug("getHSMInfo")
//	var infoResponse hsmInfo
//	var newCNSI interfaces.CNSIRecord
//
//	newCNSI.CNSIType = cnsis.CNSIHSM
//
//	uri, err := url.Parse(apiEndpoint)
//	if err != nil {
//		return newCNSI, err
//	}
//
//	uri.Path = "v1/info"
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

