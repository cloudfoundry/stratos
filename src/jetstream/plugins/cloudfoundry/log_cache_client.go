package cloudfoundry

import "net/http"

type LogCacheHttpClient struct {
	httpClient  *http.Client
	accessToken func() string
}

func NewLogCacheHttpClient(accessToken func() string) *LogCacheHttpClient {
	return &LogCacheHttpClient{
		httpClient:  http.DefaultClient,
		accessToken: accessToken,
	}
}

func (c *LogCacheHttpClient) Do(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", c.accessToken())
	return c.httpClient.Do(req)
}
