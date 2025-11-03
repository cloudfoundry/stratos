package main

import (
	"encoding/json"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// ResourceV3 represents a resource in the V3 API response
type StackResourceV3 struct {
	GUID             string `json:"guid"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	BuildRootfsImage string `json:"build_rootfs_image"`
	RunRootfsImage   string `json:"run_rootfs_image"`
	Links            struct {
		Self struct {
			Href string `json:"href"`
		} `json:"self"`
	} `json:"links"`
}
// ResponseV3 represents the V3 API response
type StackResponseV3 struct {
	Pagination PaginationV3      `json:"pagination"`
	Resources  []StackResourceV3 `json:"resources"`
}

// EntityV2 represents an entity in the V2 API response
type StackEntityV2 struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	BuildRootfsImage string `json:"build_rootfs_image"`
	RunRootfsImage   string `json:"run_rootfs_image"`
}


// Stack-specific V2 types (kept for clarity / backward compatibility)
type StackResourceV2 struct {
	Metadata MetadataV2    `json:"metadata"`
	Entity   StackEntityV2 `json:"entity"`
}

type StackResponseV2 struct {
	TotalResults int              `json:"total_results"`
	TotalPages   int              `json:"total_pages"`
	PrevURL      *string          `json:"prev_url"`
	NextURL      *string          `json:"next_url"`
	Resources    []StackResourceV2 `json:"resources"`
}

func convertV2Stacks(p *portalProxy, c echo.Context, uri *url.URL) (map[string]*api.CNSIRequest, error) {
	// Get the CNSI GUID from the header
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")
	pathLower := strings.ToLower(strings.TrimSpace(uri.Path))
	if strings.HasPrefix(pathLower, "v2/stacks/") {
		// Convert path to v3 equivalent
		parts := strings.Split(strings.TrimPrefix(uri.Path, "v2/stacks/"), "/")
		if len(parts) < 1 {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid v2 stacks request")
		}
		stackGUID := parts[0]
		if stackGUID == "" {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid v2 stacks request")
		}
		uri.Path = path.Join("v3/stacks", stackGUID)
		uri.RawQuery = "" // No query parameters for this call
		log.Debugf("Calling v3 stack API: %s", uri.Path)
		results, err := p.ProxyRequest(c, uri)
		if err != nil {
			return nil, err
		}
		result := results[cnsiList[0]]
		if result.Error != nil {
			return results, nil
		}
		v2_response_str, err := ConvertStackV3ToV2(string(result.Response))
		if err != nil {
			log.Errorf("HandleCFv2Request: could not convert v3 to v2: %+v", err)
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "Could not convert v3 to v2")
		}
		// Convert the v3 response to v2
		result.Response = []byte(v2_response_str)
		results[cnsiList[0]] = result
		return results, nil
	} else {
		if strings.HasPrefix(pathLower, "v2/stacks") {
			uri.Path = "v3/stacks"
			uri.RawQuery = "order_by=name" // Need to convert the v2
			log.Debugf("Calling v3 stacks API: %s", uri.Path)
			results, err := p.ProxyRequest(c, uri)
			if err != nil {
				return nil, err
			}
			result := results[cnsiList[0]]
			if result.Error != nil {
				return results, nil
			}
			v2_response_str, err := ConvertStacksV3ToV2(string(result.Response))
			if err != nil {
				log.Errorf("HandleCFv2Request: could not convert v3 to v2: %+v", err)
				return nil, echo.NewHTTPError(http.StatusInternalServerError, "Could not convert v3 to v2")
			}
			// Convert the v3 response to v2
			result.Response = []byte(v2_response_str)
			results[cnsiList[0]] = result
			return results, nil
		}
	}

	return nil, nil
}

// ConvertStackV3ToV2 converts a single V3 API response to a V2 API response
func ConvertStackV3ToV2(v3Response string) (string, error) {
	var v3Resp StackResourceV3
	err := json.Unmarshal([]byte(v3Response), &v3Resp)
	if err != nil {
		return "", err
	}

	metadata, entity, err := convertStackResource(v3Resp)
	if err != nil {
		return "", err
	}
	v2Resp := StackResourceV2{
		Metadata: metadata,
		Entity:   entity,
	}

	// Marshal the V2 response to JSON
	jsonBytes, err := json.Marshal(v2Resp)
	if err != nil {
		return "", err
	}

	return string(jsonBytes), nil
}

// ConvertStacksV3ToV2 converts a V3 API response to a V2 API response
func ConvertStacksV3ToV2(v3Response string) (string, error) {
	var v3Resp StackResponseV3
	err := json.Unmarshal([]byte(v3Response), &v3Resp)
	if err != nil {
		return "", err
	}

	// Initialize the V2 response
	v2Resp := StackResponseV2{
		TotalResults: v3Resp.Pagination.TotalResults,
		TotalPages:   v3Resp.Pagination.TotalPages,
	}

	// Convert pagination links
	if v3Resp.Pagination.Previous != nil {
		prevURL, err := convertLink(*v3Resp.Pagination.Previous)
		if err != nil {
			return "", err
		}
		v2Resp.PrevURL = &prevURL
	} else {
		v2Resp.PrevURL = nil
	}

	if v3Resp.Pagination.Next != nil {
		nextURL, err := convertLink(*v3Resp.Pagination.Next)
		if err != nil {
			return "", err
		}
		v2Resp.NextURL = &nextURL
	} else {
		v2Resp.NextURL = nil
	}

	// Convert resources
	for _, resource := range v3Resp.Resources {
		metadata, entity, err := convertStackResource(resource)
		if err != nil {
			return "", err
		}
		v2Resp.Resources = append(v2Resp.Resources, StackResourceV2{
			Metadata: metadata,
			Entity:   entity,
		})
	}

	// Marshal the V2 response to JSON
	jsonBytes, err := json.Marshal(v2Resp)
	if err != nil {
		return "", err
	}

	return string(jsonBytes), nil
}

// convertStackResource converts a single resource from the V3 API format to the V2 API format
func convertStackResource(resource StackResourceV3) (MetadataV2, StackEntityV2, error) {
	metadata := MetadataV2{
		GUID:      resource.GUID,
		CreatedAt: resource.CreatedAt,
		UpdatedAt: resource.UpdatedAt,
	}
	// Convert the link to the V2 format
	v2Link, err := convertLink(resource.Links.Self.Href)
	if err != nil {
		return MetadataV2{}, StackEntityV2{}, err
	}
	metadata.URL = v2Link

	entity := StackEntityV2{
		Name:             resource.Name,
		Description:      resource.Description,
		BuildRootfsImage: resource.BuildRootfsImage,
		RunRootfsImage:   resource.RunRootfsImage,
	}

	return metadata, entity, nil
}

