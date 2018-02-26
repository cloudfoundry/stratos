package caasp

import (
	"errors"
	"fmt"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"io/ioutil"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Get the Caasp metadata from the admin dashboard node
func (m *CaaspSpecification) getCaaspMetadata(c echo.Context) error {

	// Get the endpoint
	cnsiGUID := c.Param("cnsiGuid")

	// get the user
	userGUID, err := m.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("Could not find session user_id")
	}

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, err := m.portalProxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not get endpoint information")
	}

	// Make the info call to the SSH endpoint info
	// Currently this is not cached, so we must get it each time

	endpointToken, ok := m.portalProxy.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok{
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not get endpoint token information for the user")
	}
	log.Info(endpointToken)

	adminDashboard := cnsiRecord.APIEndpoint.String()

	cookieJar, _ := cookiejar.New(nil)

	httpClient := m.portalProxy.GetHttpClient(cnsiRecord.SkipSSLValidation)
	httpClient.Jar = cookieJar

	// Fetch the admin dashboard - we won't be logged in initially
	req, err := http.NewRequest("GET", adminDashboard, nil)
	if err != nil {
		panic("Could not make request")
	}

	res, err := httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	token := getCSRFToken(string(body))

	post := url.Values{}
	post.Set("authenticity_token", token)
	post.Set("user[email]", "test@test.com")
	post.Set("user[password]", "password")
	post.Set("user[remember_me]", "0")

	req, err = http.NewRequest("POST", adminDashboard+"/users/sign_in", strings.NewReader(post.Encode()))
	if err != nil {
		panic("Could not make request")
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err = httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	b, _ := ioutil.ReadAll(res.Body)

	t2 := getCSRFToken(string(b))

	// We are logged in now.....

	unixTime := time.Now().Unix()

	// Get kube config
	req, err = http.NewRequest("GET", adminDashboard+"/?_="+strconv.Itoa(int(unixTime)), nil)
	if err != nil {
		panic("Could not make request")
	}

	req.Header.Set("X-CSRF-Token", t2)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("Accept", "application/json, text/javascript, */*")

	res, err = httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	// This should be a JSON document

	defer res.Body.Close()
	b2, _ := ioutil.ReadAll(res.Body)
	c.Response().Header().Set("Content-Type", echo.MIMEApplicationJSONCharsetUTF8)
	c.JSONBlob(http.StatusOK, b2)
	return nil
}

func getCSRFToken(body string) string {
	tokenRegex := "<meta name=\\\"csrf-token\\\" content=\\\"([0-9a-zA-Z+-_/=]*)\\\""
	re, err := regexp.Compile(tokenRegex)
	if err != nil {
		return ""
	}

	reres := re.FindStringSubmatch(string(body))
	fmt.Printf("GOT: %v", reres)
	if len(reres) > 1 {
		return reres[1]
	}

	return ""
}

// Get the Kube Config from the CaaSP instance
func (m *CaaspSpecification) getCaaspKubeConfig(c echo.Context) error {
	// Get the endpoint
	cnsiGUID := c.Param("cnsiGuid")

	// get the user
	userGUID, err := m.portalProxy.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("Could not find session user_id")
	}

	// Extract the Doppler endpoint from the CNSI record
	cnsiRecord, err := m.portalProxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not get endpoint information")
	}

	// Make the info call to the SSH endpoint info
	// Currently this is not cached, so we must get it each time

	endpointToken, ok := m.portalProxy.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok{
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not get endpoint token information for the user")
	}
	log.Info(endpointToken)

	adminDashboard := cnsiRecord.APIEndpoint.String()
	cookieJar, _ := cookiejar.New(nil)

	// Fetch the auth page for getting the kueb config
	req, err := http.NewRequest("GET", adminDashboard + "/kubectl-config", nil)
	if err != nil {
		panic("Could not make request")
	}

	httpClient := m.portalProxy.GetHttpClient(cnsiRecord.SkipSSLValidation)
	httpClient.Jar = cookieJar
	httpClient.CheckRedirect = checkRedirect

	res, err := httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)
	downloadURL := getKubeConfigAuthEndpoint(string(body))

	// Get kube config
	post := url.Values{}
	post.Set("login", endpointToken.AuthToken)
	post.Set("password", endpointToken.RefreshToken)

	req, err = http.NewRequest("POST", downloadURL, strings.NewReader(post.Encode()))
	if err != nil {
		panic("Could not make request")
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err = httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	// This should be a JSON document

	defer res.Body.Close()
	b2, _ := ioutil.ReadAll(res.Body)

	downloadURL = getKubeConfigDownloadEndpoint(string(b2))

	// Fetch the auth page for getting the kueb config
	req, err = http.NewRequest("GET", downloadURL, nil)
	if err != nil {
		panic("Could not make request")
	}

	res, err = httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	body, _ = ioutil.ReadAll(res.Body)
	c.String(http.StatusOK, string(body))
	return nil
}

func checkRedirect(req *http.Request, via []*http.Request) error {
	log.Info("Check Redirect")
	log.Infof("%v+", req)
	log.Infof("%v+", via)
	return nil
}

func getKubeConfigAuthEndpoint(body string) string {

	baseRegex := "<img class=\\\"theme-navbar__logo\\\" src=\\\"([0-9a-zA-Z+-_/=?]*)\\\">"
	baseRe, err := regexp.Compile(baseRegex)
	if err != nil {
		return ""
	}

	reres := baseRe.FindStringSubmatch(string(body))
	fmt.Printf("GOT: %v", reres)
	if len(reres) != 2 {
		return ""
	}

	baseUrl := reres[1]

	if !strings.HasPrefix(baseUrl, "https://") {
		return ""
	}

	parts := strings.Split(baseUrl[8:], "/")

	log.Info(parts)

	baseUrl = "https://" + parts[0]

	log.Info(baseUrl)

	tokenRegex := "<form method=\\\"post\\\" action=\\\"([0-9a-zA-Z+-_/=?]*)\\\">"
	re, err := regexp.Compile(tokenRegex)
	if err != nil {
		return ""
	}

	reres = re.FindStringSubmatch(string(body))
	fmt.Printf("GOT: %v", reres)
	if len(reres) > 1 {
		return baseUrl + reres[1]
	}

	return ""
}



//window.location.href = "https://caasp-admin.devenv.capbristol.com/oidc/kubeconfig?client_id=caasp-cli&amp;client_secret=swac7qakes7AvucH8bRucucH&amp;email=test%40test.com&amp;id_token=eyJhbGciOiJSUzI1NiIsImtpZCI6ImQzNmJiODcxNjMwNjFkOTIzZTgyYmYwMTVhOTkwZGI2ZGQ5NzQ0MTYifQ.eyJpc3MiOiJodHRwczovL2t1YmUtYXBpLmRldmVudi5jYXBicmlzdG9sLmNvbTozMjAwMCIsInN1YiI6IkNpMTFhV1E5ZEdWemRDeHZkVDFRWlc5d2JHVXNaR005YVc1bWNtRXNaR005WTJGaGMzQXNaR005Ykc5allXd1NCR3hrWVhBIiwiYXVkIjoiY2Fhc3AtY2xpIiwiZXhwIjoxNTE5NzI4NzQyLCJpYXQiOjE1MTk2NDIzNDIsIm5vbmNlIjoiYTVlZGY2ZTljYThhOTA1ZDhhMTdlYzYwNzlkYWVjOTUiLCJhdF9oYXNoIjoiNzk5Z0pBUjlGeGZFeXZtR215TmhRZyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJncm91cHMiOlsiQWRtaW5pc3RyYXRvcnMiXSwibmFtZSI6IkEgVXNlciJ9.EuBNvpvbmtGtrtqjqrqqyLLSSPYVFhEDjYfEtAm-CJAa24AW2FIXexezm0b_UptIvaU8X0U34k9teMhf1WnGvxmkNONC_vnskV07hP3yvc5iEvaH0q0mhuGPrgWGrRKosL3whovJzGrnpBQnnFhHIRZq9hKU4UtNe-2T7EmDAtANdaf1UhHX3EZF1IbwO62QJc87d-uuQclPw3UNmRKbG4NmsUT2BTrwLFl9_XYqvVo5-oUojLIljhyCED_U-541vsop730caP3BnmAEKAOoxyjTpckvKH0XwX2V7wOc8Xo-R28AjNhvsqlDD1gdHna-uxP0owHisF41xRGo6I6cPw&amp;idp_issuer_url=https%3A%2F%2Fkube-api.devenv.capbristol.com%3A32000&amp;refresh_token=Chl5ZWpwdG5oZGs2bWtheHczZGtsdG43eTVmEhl4MmJqcDRpMmxqdHNrenFqbTVmYTR0aXo0"

func getKubeConfigDownloadEndpoint(body string) string {

	baseRegex := "window.location.href = \\\"([0-9a-zA-Z+-_/=?&%;]*)\\\""
	baseRe, err := regexp.Compile(baseRegex)
	if err != nil {
		return ""
	}

	reres := baseRe.FindStringSubmatch(string(body))
	fmt.Printf("GOT: %v", reres)
	if len(reres) != 2 {
		return ""
	}

	baseUrl := reres[1]
	return baseUrl
}

