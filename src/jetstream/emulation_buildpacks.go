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

/* Sample v2 Buildpack resource code for reference: /v2/buildpacks/216ea2ac-2b44-4d4f-9046-1d9624fd0424

{
  "metadata": {
    "guid": "216ea2ac-2b44-4d4f-9046-1d9624fd0424",
    "url": "/v2/buildpacks/216ea2ac-2b44-4d4f-9046-1d9624fd0424",
    "created_at": "2023-09-08T21:55:47Z",
    "updated_at": "2025-09-06T21:39:36Z"
  },
  "entity": {
    "name": "staticfile_buildpack",
    "stack": "cflinuxfs4",
    "position": 12,
    "enabled": true,
    "locked": false,
    "filename": "staticfile_buildpack-cflinuxfs4-v1.6.17.zip"
  }
}

*/

/* Sample v3 Buildpack resource code for reference: /v3/buildpacks/216ea2ac-2b44-4d4f-9046-1d9624fd0424

{
  "guid": "216ea2ac-2b44-4d4f-9046-1d9624fd0424",
  "created_at": "2023-09-08T21:55:47Z",
  "updated_at": "2025-09-06T21:39:36Z",
  "name": "staticfile_buildpack",
  "stack": "cflinuxfs4",
  "state": "READY",
  "filename": "staticfile_buildpack-cflinuxfs4-v1.6.17.zip",
  "position": 12,
  "enabled": true,
  "locked": false,
  "metadata": {
    "labels": {},
    "annotations": {}
  },
  "links": {
    "self": {
      "href": "https://api.sys.adepttech.ca/v3/buildpacks/216ea2ac-2b44-4d4f-9046-1d9624fd0424"
    },
    "upload": {
      "href": "https://api.sys.adepttech.ca/v3/buildpacks/216ea2ac-2b44-4d4f-9046-1d9624fd0424/upload",
      "method": "POST"
    }
  }
}

*/

/* Sample v2 Buildpacks list response for reference: /v2/buildpacks

{
  "total_results": 4,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "a441eb0b-5edc-4d3b-a4ab-8de67e51f2d4",
        "url": "/v2/buildpacks/a441eb0b-5edc-4d3b-a4ab-8de67e51f2d4",
        "created_at": "2023-03-29T04:59:28Z",
        "updated_at": "2025-09-06T21:39:34Z"
      },
      "entity": {
        "name": "staticfile_buildpack",
        "stack": "cflinuxfs3",
        "position": 1,
        "enabled": true,
        "locked": false,
        "filename": "staticfile_buildpack-cflinuxfs3-v1.6.17.zip"
      }
    },
    {
      "metadata": {
        "guid": "9b3c27bf-b822-48bc-abea-2556956de82c",
        "url": "/v2/buildpacks/9b3c27bf-b822-48bc-abea-2556956de82c",
        "created_at": "2023-03-29T04:59:30Z",
        "updated_at": "2025-09-06T21:39:36Z"
      },
      "entity": {
        "name": "java_buildpack",
        "stack": "cflinuxfs3",
        "position": 2,
        "enabled": true,
        "locked": false,
        "filename": "java-buildpack-cflinuxfs3-v4.71.0.zip"
      }
    },
    {
      "metadata": {
        "guid": "5c2db58c-9056-474b-9f2a-28ca2eb7e053",
        "url": "/v2/buildpacks/5c2db58c-9056-474b-9f2a-28ca2eb7e053",
        "created_at": "2023-09-08T21:55:54Z",
        "updated_at": "2025-09-06T21:39:44Z"
      },
      "entity": {
        "name": "binary_buildpack",
        "stack": "cflinuxfs4",
        "position": 22,
        "enabled": true,
        "locked": false,
        "filename": "binary_buildpack-cflinuxfs4-v1.1.14.zip"
      }
    },
    {
      "metadata": {
        "guid": "482560e3-06d2-445b-88f9-991beb93a614",
        "url": "/v2/buildpacks/482560e3-06d2-445b-88f9-991beb93a614",
        "created_at": "2024-04-17T00:05:01Z",
        "updated_at": "2024-04-17T00:05:16Z"
      },
      "entity": {
        "name": "stratos_buildpack",
        "stack": null,
        "position": 23,
        "enabled": true,
        "locked": false,
        "filename": "stratos_buildpack-v4.91.zip"
      }
    }
  ]
}
*/

/* sample v3 Buildpacks list response for reference: /v3/buildpacks

{
  "pagination": {
    "total_results": 23,
    "total_pages": 1,
    "first": {
      "href": "https://api.sys.adepttech.ca/v3/buildpacks?page=1&per_page=50"
    },
    "last": {
      "href": "https://api.sys.adepttech.ca/v3/buildpacks?page=1&per_page=50"
    },
    "next": null,
    "previous": null
  },
  "resources": [
    {
      "guid": "a441eb0b-5edc-4d3b-a4ab-8de67e51f2d4",
      "created_at": "2023-03-29T04:59:28Z",
      "updated_at": "2025-09-06T21:39:34Z",
      "name": "staticfile_buildpack",
      "stack": "cflinuxfs3",
      "state": "READY",
      "filename": "staticfile_buildpack-cflinuxfs3-v1.6.17.zip",
      "position": 1,
      "enabled": true,
      "locked": false,
      "metadata": {
        "labels": {},
        "annotations": {}
      },
      "links": {
        "self": {
          "href": "https://api.sys.adepttech.ca/v3/buildpacks/a441eb0b-5edc-4d3b-a4ab-8de67e51f2d4"
        },
        "upload": {
          "href": "https://api.sys.adepttech.ca/v3/buildpacks/a441eb0b-5edc-4d3b-a4ab-8de67e51f2d4/upload",
          "method": "POST"
        }
      }
    },
    {
      "guid": "5c2db58c-9056-474b-9f2a-28ca2eb7e053",
      "created_at": "2023-09-08T21:55:54Z",
      "updated_at": "2025-09-06T21:39:44Z",
      "name": "binary_buildpack",
      "stack": "cflinuxfs4",
      "state": "READY",
      "filename": "binary_buildpack-cflinuxfs4-v1.1.14.zip",
      "position": 22,
      "enabled": true,
      "locked": false,
      "metadata": {
        "labels": {},
        "annotations": {}
      },
      "links": {
        "self": {
          "href": "https://api.sys.adepttech.ca/v3/buildpacks/5c2db58c-9056-474b-9f2a-28ca2eb7e053"
        },
        "upload": {
          "href": "https://api.sys.adepttech.ca/v3/buildpacks/5c2db58c-9056-474b-9f2a-28ca2eb7e053/upload",
          "method": "POST"
        }
      }
    },
    {
      "guid": "482560e3-06d2-445b-88f9-991beb93a614",
      "created_at": "2024-04-17T00:05:01Z",
      "updated_at": "2024-04-17T00:05:16Z",
      "name": "stratos_buildpack",
      "stack": null,
      "state": "READY",
      "filename": "stratos_buildpack-v4.91.zip",
      "position": 23,
      "enabled": true,
      "locked": false,
      "metadata": {
        "labels": {},
        "annotations": {}
      },
      "links": {
        "self": {
          "href": "https://api.sys.adepttech.ca/v3/buildpacks/482560e3-06d2-445b-88f9-991beb93a614"
        },
        "upload": {
          "href": "https://api.sys.adepttech.ca/v3/buildpacks/482560e3-06d2-445b-88f9-991beb93a614/upload",
          "method": "POST"
        }
      }
    }
  ]
}	
*/

// Buildpack-specific V2 types (duplicate structs for buildpacks)
type BuildpackResourceV2 struct {
	Metadata MetadataV2        `json:"metadata"`
	Entity   BuildpackEntityV2 `json:"entity"`
}

type BuildpackResponseV2 struct {
	TotalResults int                 `json:"total_results"`
	TotalPages   int                 `json:"total_pages"`
	PrevURL      *string             `json:"prev_url"`
	NextURL      *string             `json:"next_url"`
	Resources    []BuildpackResourceV2 `json:"resources"`
}

// BuildpackEntityV2 represents an entity in the V2 API response for buildpacks
type BuildpackEntityV2 struct {
	Name     string `json:"name"`
	Stack    string `json:"stack"`
	Position int    `json:"position"`
	Enabled  bool   `json:"enabled"`
	Locked   bool   `json:"locked"`
	Filename string `json:"filename"`
}

type BuildpackResourceV3 struct {
	GUID      string `json:"guid"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	Name      string `json:"name"`
	Stack     string `json:"stack"`
	Position  int    `json:"position"`
	Enabled   bool   `json:"enabled"`
	Locked    bool   `json:"locked"`
	Filename  string `json:"filename"`
	Links     struct {
		Self struct {
			Href string `json:"href"`
		} `json:"self"`
	} `json:"links"`
}


// convertBuildpackResource converts a single buildpack resource from the V3 API format to the V2 API format
func convertBuildpackResource(resource BuildpackResourceV3) (MetadataV2, BuildpackEntityV2, error) {
	metadata := MetadataV2{
		GUID:      resource.GUID,
		CreatedAt: resource.CreatedAt,
		UpdatedAt: resource.UpdatedAt,
	}
	// Convert the link to the V2 format
	v2Link, err := convertLink(resource.Links.Self.Href)
	if err != nil {
		return MetadataV2{}, BuildpackEntityV2{}, err
	}
	metadata.URL = v2Link

	entity := BuildpackEntityV2{
		Name:     resource.Name,
		Stack:    resource.Stack,
		Position: resource.Position,
		Enabled:  resource.Enabled,
		Locked:   resource.Locked,
		Filename: resource.Filename,
	}

	return metadata, entity, nil
}	

// ConvertBuildpackV3ToV2 converts a single V3 API response to a V2 API response
func ConvertBuildpackV3ToV2(v3Response string) (string, error) {
	var v3Resp BuildpackResourceV3
	err := json.Unmarshal([]byte(v3Response), &v3Resp)
	if err != nil {
		return "", err
	}

	metadata, entity, err := convertBuildpackResource(v3Resp)
	if err != nil {
		return "", err
	}
	v2Resp := BuildpackResourceV2{
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

// --- Added: V3 list type for buildpacks and list conversion function ---

// BuildpackResponseV3 represents the V3 API response for buildpacks (list)
type BuildpackResponseV3 struct {
	Pagination PaginationV3        `json:"pagination"`
	Resources  []BuildpackResourceV3 `json:"resources"`
}

// ConvertBuildpacksV3ToV2 converts a V3 buildpacks list response to a V2 buildpacks list response
func ConvertBuildpacksV3ToV2(v3Response string) (string, error) {
	var v3Resp BuildpackResponseV3
	err := json.Unmarshal([]byte(v3Response), &v3Resp)
	if err != nil {
		return "", err
	}

	// Initialize the V2 response
	v2Resp := BuildpackResponseV2{
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
		metadata, entity, err := convertBuildpackResource(resource)
		if err != nil {
			return "", err
		}
		v2Resp.Resources = append(v2Resp.Resources, BuildpackResourceV2{
			Metadata: metadata,
			Entity:   entity,
		})
		// Replace the generic ResourceV2.Entity with the concrete BuildpackEntityV2 by re-marshalling
		// Build a ResourceV2 with the correct entity type via direct construction:
		v2Resp.Resources[len(v2Resp.Resources)-1] = BuildpackResourceV2{
			Metadata: metadata,
			Entity:   BuildpackEntityV2{}, // placeholder for type compatibility with ResourceV2's entity field
		}
		// We need to directly construct the JSON for this resource because ResourceV2.Entity is StackEntityV2 in the original struct.
		// Instead we'll construct a small wrapper and then marshal the full response at the end using dynamic structs.

	}

	// Because ResourceV2's Entity type used in this file is StackEntityV2 (for stacks),
	// construct the final response dynamically to include buildpack entities correctly.
	type buildpackResourceOut struct {
		Metadata MetadataV2         `json:"metadata"`
		Entity   BuildpackEntityV2  `json:"entity"`
	}
	out := struct {
		TotalResults int                 `json:"total_results"`
		TotalPages   int                 `json:"total_pages"`
		PrevURL      *string             `json:"prev_url"`
		NextURL      *string             `json:"next_url"`
		Resources    []buildpackResourceOut `json:"resources"`
	}{
		TotalResults: v2Resp.TotalResults,
		TotalPages:   v2Resp.TotalPages,
		PrevURL:      v2Resp.PrevURL,
		NextURL:      v2Resp.NextURL,
		Resources:    []buildpackResourceOut{},
	}

	// Re-run conversion for resources to populate proper BuildpackEntityV2 entries
	for _, resource := range v3Resp.Resources {
		metadata, entity, err := convertBuildpackResource(resource)
		if err != nil {
			return "", err
		}
		out.Resources = append(out.Resources, buildpackResourceOut{
			Metadata: metadata,
			Entity:   entity,
		})
	}

	// Marshal the V2 response to JSON
	jsonBytes, err := json.Marshal(out)
	if err != nil {
		return "", err
	}

	return string(jsonBytes), nil
}

func convertV2Buildpacks(p *portalProxy, c echo.Context, uri *url.URL) (map[string]*api.CNSIRequest, error) {
	// Get the CNSI GUID from the header
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")
	pathLower := strings.ToLower(strings.TrimSpace(uri.Path))
	if strings.HasPrefix(pathLower, "v2/buildpacks/") {
		// Convert path to v3 equivalent
		parts := strings.Split(strings.TrimPrefix(uri.Path, "v2/buildpacks/"), "/")
		if len(parts) < 1 {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid v2 buildpacks request")
		}
		buildpackGUID := parts[0]
		if buildpackGUID == "" {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid v2 buildpacks request")
		}
		uri.Path = path.Join("v3/buildpacks", buildpackGUID)
		uri.RawQuery = "" // No query parameters for this call
		log.Debugf("Calling v3 buildpack API: %s", uri.Path)
		results, err := p.ProxyRequest(c, uri)
		if err != nil {
			return nil, err
		}
		result := results[cnsiList[0]]
		if result.Error != nil {
			return results, nil
		}
		v2_response_str, err := ConvertBuildpackV3ToV2(string(result.Response))
		if err != nil {
			log.Errorf("HandleCFv2Request: could not convert buildpack v3 to v2: %+v", err)
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "Could not convert buildpack v3 to v2")
		}
		// Convert the v3 response to v2
		result.Response = []byte(v2_response_str)
		results[cnsiList[0]] = result
		return results, nil
	} else {
		if strings.HasPrefix(pathLower, "v2/buildpacks") {
			uri.Path = "v3/buildpacks"
			uri.RawQuery = "order_by=position" // Need to convert the v2
			log.Debugf("Calling v3 buildpacks API: %s", uri.Path)
			results, err := p.ProxyRequest(c, uri)
			if err != nil {
				return nil, err
			}
			result := results[cnsiList[0]]
			if result.Error != nil {
				return results, nil
			}
			v2_response_str, err := ConvertBuildpacksV3ToV2(string(result.Response))
			if err != nil {
				log.Errorf("HandleCFv2Request: could not convert buildpacks v3 to v2: %+v", err)
				return nil, echo.NewHTTPError(http.StatusInternalServerError, "Could not convert buildpacks v3 to v2")
			}
			// Convert the v3 response to v2
			result.Response = []byte(v2_response_str)
			results[cnsiList[0]] = result
			return results, nil
		}
	}
	return nil, nil
}
