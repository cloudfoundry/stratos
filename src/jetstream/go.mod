module github.com/cloudfoundry-incubator/stratos/src/jetstream

go 1.12

require (
	bitbucket.org/liamstask/goose v0.0.0-20150115234039-8488cc47d90c
	code.cloudfoundry.org/bytefmt v0.0.0-20180906201452-2aa6f33b730c // indirect
	code.cloudfoundry.org/cli v6.43.0+incompatible
	code.cloudfoundry.org/gofileutils v0.0.0-20170111115228-4d0c80011a0f // indirect
	github.com/Azure/go-ansiterm v0.0.0-20170929234023-d6e3b3328b78 // indirect
	github.com/SermoDigital/jose v0.9.1
	github.com/Sirupsen/logrus v0.0.0-00010101000000-000000000000 // indirect
	github.com/antonlindstrom/pgstore v0.0.0-20170604072116-a407030ba6d0
	github.com/blang/semver v3.5.1+incompatible // indirect
	github.com/bmatcuk/doublestar v1.1.1 // indirect
	github.com/cf-stratos/mysqlstore v0.0.0-20170822100912-304308519d13
	github.com/charlievieth/fs v0.0.0-20170613215519-7dc373669fa1 // indirect
	github.com/cloudfoundry-community/go-cfenv v1.17.0
	github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes v0.0.0-00010101000000-000000000000
	github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular v0.0.0-00010101000000-000000000000
	github.com/cloudfoundry/bosh-cli v5.4.0+incompatible // indirect
	github.com/cloudfoundry/bosh-utils v0.0.0-20190206192830-9a0affed2bf1 // indirect
	github.com/cloudfoundry/cli-plugin-repo v0.0.0-20190220174354-ecf721ef3813 // indirect
	github.com/cloudfoundry/noaa v2.1.0+incompatible
	github.com/cloudfoundry/sonde-go v0.0.0-20171206171820-b33733203bb4
	github.com/cppforlife/go-patch v0.2.0 // indirect
	github.com/dgrijalva/jwt-go v3.2.0+incompatible // indirect
	github.com/domodwyer/mailyak v3.1.1+incompatible
	github.com/dsnet/compress v0.0.0-20171208185109-cc9eb1d7ad76 // indirect
	github.com/fatih/color v1.7.0 // indirect
	github.com/go-sql-driver/mysql v1.4.1
	github.com/golang/snappy v0.0.1 // indirect
	github.com/google/go-querystring v1.0.0 // indirect
	github.com/gopherjs/gopherjs v0.0.0-20190411002643-bd77b112433e // indirect
	github.com/gorilla/context v1.1.1
	github.com/gorilla/securecookie v1.1.1
	github.com/gorilla/sessions v1.1.3
	github.com/gorilla/websocket v1.4.1
	github.com/govau/cf-common v0.0.7
	github.com/jessevdk/go-flags v1.4.0 // indirect
	github.com/jtolds/gls v4.20.0+incompatible // indirect
	github.com/kat-co/vala v0.0.0-20170210184112-42e1d8b61f12
	github.com/kubeapps/common v0.0.0-20181107174310-61d8eb6f11b4
	github.com/labstack/echo v3.3.10+incompatible
	github.com/labstack/gommon v0.3.0 // indirect
	github.com/lib/pq v1.1.0 // indirect
	github.com/lunixbochs/vtclean v1.0.0 // indirect
	github.com/mailru/easyjson v0.0.0-20190221075403-6243d8e04c3f // indirect
	github.com/mattn/go-colorable v0.1.4 // indirect
	github.com/mattn/go-isatty v0.0.10 // indirect
	github.com/mattn/go-runewidth v0.0.4 // indirect
	github.com/mattn/go-sqlite3 v1.13.0
	github.com/mholt/archiver v3.1.1+incompatible
	github.com/mitchellh/mapstructure v1.1.2 // indirect
	github.com/moby/moby v1.13.1 // indirect
	github.com/nu7hatch/gouuid v0.0.0-20131221200532-179d4d0c4d8d // indirect
	github.com/nwaples/rardecode v1.0.0 // indirect
	github.com/nwmac/sqlitestore v0.0.0-20180824125213-7d2ab221fb3f
	github.com/onsi/ginkgo v1.11.0 // indirect
	github.com/onsi/gomega v1.8.1 // indirect
	github.com/pierrec/lz4 v2.0.5+incompatible // indirect
	github.com/satori/go.uuid v1.2.0
	github.com/sirupsen/logrus v1.3.0
	github.com/smartystreets/assertions v0.0.0-20190401211740-f487f9de1cd3 // indirect
	github.com/smartystreets/goconvey v0.0.0-20190222223459-a17d461953aa
	github.com/ulikunitz/xz v0.5.6 // indirect
	github.com/valyala/fasttemplate v1.1.0 // indirect
	github.com/vito/go-interact v0.0.0-20171111012221-fa338ed9e9ec // indirect
	github.com/xi2/xz v0.0.0-20171230120015-48954b6210f8 // indirect
	golang.org/x/crypto v0.0.0-20190611184440-5c40567a22f8
	gopkg.in/DATA-DOG/go-sqlmock.v1 v1.0.0-00010101000000-000000000000
	gopkg.in/cheggaaa/pb.v1 v1.0.27 // indirect
	gopkg.in/yaml.v2 v2.2.7
)

replace github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes => ./plugins/kubernetes

replace github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular => ./plugins/monocular

replace (
	github.com/SermoDigital/jose => github.com/SermoDigital/jose v0.9.2-0.20180104203859-803625baeddc
	github.com/Sirupsen/logrus => github.com/sirupsen/logrus v1.4.1
	github.com/helm/monocular/chartrepo => ./plugins/monocular/chart-repo
	github.com/helm/monocular/chartsvc => ./plugins/monocular/chartsvc
	github.com/kubernetes-sigs/aws-iam-authenticator => github.com/kubernetes-sigs/aws-iam-authenticator v0.3.1-0.20190111160901-390d9087a4bc
	github.com/russross/blackfriday v2.0.0+incompatible => github.com/russross/blackfriday v1.5.2
	github.com/sergi/go-diff => github.com/sergi/go-diff v1.0.0
	github.com/smartystreets/goconvey => github.com/smartystreets/goconvey v0.0.0-20160503033757-d4c757aa9afd
	github.com/spf13/cobra => github.com/spf13/cobra v0.0.3
	gopkg.in/DATA-DOG/go-sqlmock.v1 => github.com/DATA-DOG/go-sqlmock v1.1.3
	k8s.io/api => k8s.io/api v0.0.0-20190222213804-5cb15d344471
	k8s.io/apiextensions-apiserver => k8s.io/apiextensions-apiserver v0.0.0-20190221221350-bfb440be4b87
	k8s.io/apimachinery => k8s.io/apimachinery v0.0.0-20190221213512-86fb29eff628
	k8s.io/apiserver => k8s.io/apiserver v0.0.0-20190221215341-5838f549963b
	k8s.io/cli-runtime => k8s.io/cli-runtime v0.0.0-20190221221947-d8fee89e76ca
	k8s.io/kube-openapi => k8s.io/kube-openapi v0.0.0-20180509051136-39cb288412c4
	k8s.io/kubernetes => k8s.io/kubernetes v1.13.3
)
