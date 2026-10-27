---
title: API Keys
sidebar_label: API Keys
---

An API key lets a script or another tool call the Stratos API as you, without
logging in through a browser. Stratos creates the key; you copy its secret to
wherever the tool keeps its credentials.

## Who can create keys

The `API_KEYS_ENABLED` environment variable (Helm chart value
`console.apiKeysEnabled`) decides:

| Value | Who can create and use keys |
|-------|-----------------------------|
| `disabled` | Nobody. |
| `admin_only` (default) | Stratos administrators. |
| `all_users` | Every user. |

The user menu offers **API Keys** only to users who can create keys.

## Creating a key

1. Open the user menu and choose **API Keys**.
2. Click **+** (Create API Key) and give the key a description, such as the
   name of the tool that will use it. The description is only a label, so you
   can tell your keys apart later.
3. Click **Create**. The page shows the key's secret with a copy button.

The secret is shown once. Stratos keeps no way to show it again, so copy it
before you close the message. If you lose it, delete the key and create a new
one.

## Using a key

Send the secret in an `Authentication` header with the `Bearer` scheme. Note
the header name: it is `Authentication`, not the more usual `Authorization`.

```
Authentication: Bearer <secret>
```

A key works on the API's stable routes:

| Route | Does |
|-------|------|
| `GET /api/v1/endpoints` | Lists the endpoints you can see |
| `POST /api/v1/tokens` | Connects an endpoint |
| `DELETE /api/v1/tokens/<endpoint guid>` | Disconnects an endpoint |
| `GET /api/v1/proxy/<endpoint guid>/<path>` | Sends one request to an endpoint you are connected to |

Keys cannot create or delete keys; that takes a browser login.

For example, keep the header in a file only you can read, so the secret
appears in no command line or shell history. Create `~/.stratos-api-key` in
an editor with the single line `Authentication: Bearer <secret>`, then:

```bash
chmod 600 ~/.stratos-api-key
curl -H @"$HOME/.stratos-api-key" https://<stratos-address>/api/v1/endpoints
```

## Deleting a key

The API Keys page lists your keys by description. Delete a key from its row's
actions (Delete, then confirm); a tool still using it is refused, as a
request without a key would be.
