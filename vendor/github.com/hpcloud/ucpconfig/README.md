# ucpconfig

A small package to help load structs from UCP configurations.

For a complete example save the below to a file "test.go" and then run it:

```go
package main

import (
	"fmt"

	"github.com/hpcloud/ucpconfig"
)

// Config for the app
type Config struct {
	Port    uint   `ucp:"PORT"`
	Name    string `ucp:"SERVICE_NAME"`
	Ignored string
}

func main() {
	var config Config

	if err := ucpconfig.Load(&config); err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println("Port:", config.Port)
}
```

```bash
$ env PORT=4222 go run test.go
> Port: 4222
```
