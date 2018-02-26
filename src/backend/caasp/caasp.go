package caasp

import (
	"crypto/tls"
	"fmt"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"io/ioutil"
	"net"
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
	// My testing

	adminDashboard := "https://149.44.104.40:9234"

	cookieJar, _ := cookiejar.New(nil)

	httpClientSkipSSL := &http.Client{
		Jar: cookieJar,
	}

	log.Info(cookieJar)

	dial := (&net.Dialer{
		Timeout:   time.Duration(30) * time.Second,
		KeepAlive: 30 * time.Second, // should be less than any proxy connection timeout (typically 2-3 minutes)
	}).Dial

	trSkipSSL := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		Dial:                dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
		MaxIdleConnsPerHost: 6, // (default is 2)
	}

	httpClientSkipSSL.Transport = trSkipSSL

	//re = regex.MustCompile(tokenRegex)

	// Fetch the admin dashboard - we won't be logged in initially
	req, err := http.NewRequest("GET", adminDashboard, nil)
	if err != nil {
		panic("Could not make request")
	}

	res, err := httpClientSkipSSL.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	log.Info(string(body))

	token := getCSRFToken(string(body))
	log.Info(token)

	// Now log in and get the cookie and X-CSRF-Token header
	// Make a note of the session value we got back in the cookie
	cookie := res.Header.Get("Set-Cookie")

	// We only need the first part of the cookie, split by ;

	cookieParts := strings.Split(cookie, ";")
	cookie = cookieParts[0]
	log.Info(cookie)

	parts := strings.SplitAfter(cookie, "_velum_session=")
	log.Info(parts)
	cookie = parts[1]
	log.Info(cookie)

	post := url.Values{}
	post.Set("authenticity_token", token)
	post.Set("user[email]", "test@test.com")
	post.Set("user[password]", "password")
	post.Set("user[remember_me]", "0")

	req, err = http.NewRequest("POST", adminDashboard+"/users/sign_in", strings.NewReader(post.Encode()))
	if err != nil {
		panic("Could not make request")
	}

	//	req.Header.Set("Cookie", cookie)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	//cook := http.Cookie{Name: "_velum_session", Value: cookie}
	//req.AddCookie(&cook)

	res, err = httpClientSkipSSL.Do(req)
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

	res, err = httpClientSkipSSL.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	// This should be a JSON document

	defer res.Body.Close()
	b2, _ := ioutil.ReadAll(res.Body)
	log.Info(string(b2))

	// Get the main data

	//
	// 	utf8:✓
	// authenticity_token:qar+pk+xB6wlRyIv1sz9uSWWNrte9Skdg2F1K18CVpmuye80Y61SCHh0Et0lpibdhd65LwR3gKFqgQt4XzGS9w==
	// user[email]:test@test.com
	// user[password]:password
	// user[remember_me]:0

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
