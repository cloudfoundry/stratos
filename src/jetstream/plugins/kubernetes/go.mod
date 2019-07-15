module github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes

go 1.12

require (
	github.com/MakeNowJust/heredoc v0.0.0-20171113091838-e9091a26100e // indirect
	github.com/Masterminds/goutils v1.1.0 // indirect
	github.com/Masterminds/semver v1.4.2 // indirect
	github.com/Masterminds/sprig v2.18.0+incompatible // indirect
	github.com/SermoDigital/jose v0.9.1
	github.com/aws/aws-sdk-go v1.17.5
	github.com/chai2010/gettext-go v0.0.0-20170215093142-bf70f2a70fb1 // indirect
	github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces v0.0.0-00010101000000-000000000000
	github.com/cyphar/filepath-securejoin v0.2.2 // indirect
	github.com/docker/distribution v2.7.1+incompatible // indirect
	github.com/docker/docker v1.13.1 // indirect
	github.com/docker/spdystream v0.0.0-20181023171402-6480d4af844c // indirect
	github.com/evanphx/json-patch v4.1.0+incompatible // indirect
	github.com/exponent-io/jsonpath v0.0.0-20151013193312-d6023ce2651d // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/go-openapi/spec v0.18.0 // indirect
	github.com/gobwas/glob v0.2.3 // indirect
	github.com/gogo/protobuf v1.2.1 // indirect
	github.com/golang/groupcache v0.0.0-20190129154638-5b532d6fd5ef // indirect
	github.com/google/btree v0.0.0-20180813153112-4030bb1f1f0c // indirect
	github.com/google/gofuzz v0.0.0-20170612174753-24818f796faf // indirect
	github.com/google/uuid v1.1.0 // indirect
	github.com/googleapis/gnostic v0.2.0 // indirect
	github.com/gregjones/httpcache v0.0.0-20190212212710-3befbb6ad0cc // indirect
	github.com/grpc-ecosystem/go-grpc-prometheus v1.2.0 // indirect
	github.com/hashicorp/golang-lru v0.5.0 // indirect
	github.com/helm/monocular v1.4.0
	github.com/helm/monocular/chartsvc v0.0.0-00010101000000-000000000000
	github.com/heptio/authenticator v0.3.0 // indirect
	github.com/huandu/xstrings v1.2.0 // indirect
	github.com/imdario/mergo v0.3.7 // indirect
	github.com/json-iterator/go v1.1.5 // indirect
	github.com/kubeapps/common v0.0.0-20181107174310-61d8eb6f11b4
	github.com/kubernetes-sigs/aws-iam-authenticator v0.3.0
	github.com/labstack/echo v3.3.10+incompatible
	github.com/mitchellh/go-wordwrap v1.0.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.1 // indirect
	github.com/mxk/go-flowrate v0.0.0-20140419014527-cca7078d478f
	github.com/opencontainers/go-digest v1.0.0-rc1 // indirect
	github.com/peterbourgon/diskv v2.0.1+incompatible // indirect
	github.com/pkg/errors v0.8.1 // indirect
	github.com/russross/blackfriday v2.0.0+incompatible // indirect
	github.com/satori/go.uuid v1.2.0 // indirect
	github.com/shurcooL/sanitized_anchor_name v1.0.0 // indirect
	github.com/sirupsen/logrus v1.3.0
	github.com/spf13/cobra v0.0.3 // indirect
	github.com/spf13/pflag v1.0.3 // indirect
	github.com/technosophos/moniker v0.0.0-20180509230615-a5dbd03a2245 // indirect
	golang.org/x/net v0.0.0-20190225153610-fe579d43d832 // indirect
	golang.org/x/oauth2 v0.0.0-20190226191147-529b322ea346 // indirect
	golang.org/x/time v0.0.0-20181108054448-85acf8d2951c // indirect
	google.golang.org/grpc v1.19.0 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/square/go-jose.v2 v2.2.2 // indirect
	gopkg.in/yaml.v2 v2.2.2
	k8s.io/api v0.0.0-20190226013409-f951fa7b8c72
	k8s.io/apiextensions-apiserver v0.0.0-20190225215027-42f453e3c54a // indirect
	k8s.io/apimachinery v0.0.0-20190117220443-572dfc7bdfcb
	k8s.io/apiserver v0.0.0-20190225213950-239e48e34c98 // indirect
	k8s.io/cli-runtime v0.0.0-20190223141024-b5efea9a9c9c // indirect
	k8s.io/client-go v10.0.0+incompatible
	k8s.io/helm v2.12.3+incompatible
	k8s.io/klog v0.2.0
	k8s.io/kube-openapi v0.0.0-20190225204428-d50a959ae76a // indirect
	k8s.io/kubernetes v1.13.3
	k8s.io/utils v0.0.0-20190221042446-c2654d5206da // indirect
	sigs.k8s.io/yaml v1.1.0 // indirect
	vbom.ml/util v0.0.0-20180919145318-efcd4e0f9787 // indirect
)

replace (
	github.com/SermoDigital/jose => github.com/SermoDigital/jose v0.9.2-0.20180104203859-803625baeddc
	github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces => ../../repository/interfaces
	github.com/helm/monocular/chartsvc => ../monocular/chartsvc
	github.com/kubernetes-sigs/aws-iam-authenticator => github.com/kubernetes-sigs/aws-iam-authenticator v0.3.1-0.20190111160901-390d9087a4bc
	github.com/russross/blackfriday v2.0.0+incompatible => github.com/russross/blackfriday v1.5.2
	github.com/sergi/go-diff => github.com/sergi/go-diff v1.0.0
	github.com/spf13/cobra => github.com/spf13/cobra v0.0.3
	k8s.io/api => k8s.io/api v0.0.0-20190222213804-5cb15d344471
	k8s.io/apiextensions-apiserver => k8s.io/apiextensions-apiserver v0.0.0-20190221221350-bfb440be4b87
	k8s.io/apimachinery => k8s.io/apimachinery v0.0.0-20190221213512-86fb29eff628
	k8s.io/apiserver => k8s.io/apiserver v0.0.0-20190221215341-5838f549963b
	k8s.io/cli-runtime => k8s.io/cli-runtime v0.0.0-20190221221947-d8fee89e76ca
	k8s.io/client-go => k8s.io/client-go v2.0.0-alpha.0.0.20190202011228-6e4752048fde+incompatible
	k8s.io/kube-openapi => k8s.io/kube-openapi v0.0.0-20180509051136-39cb288412c4
	k8s.io/kubernetes => k8s.io/kubernetes v1.13.3
)
