import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'

const features = [
  {
    title: 'Cloud Foundry',
    image: 'img/cloudfoundry.png',
    description:
      "Stratos is the de-facto UI for Cloud Foundry, providing a rich management experience for all your Cloud Foundry needs... and we're an official Cloud Foundry project too!"
  },
  {
    title: 'Kubernetes',
    image: 'img/kubernetes.svg',
    description:
      'Stratos sports a growing feature set for Kubernetes developers, extending its reach further towards providing a single pane of glass for your Cloud Native application development needs.'
  },
  {
    title: 'Multi-Cluster',
    image: 'img/multi-cluster.svg',
    description:
      'Stratos allows you to manage multiple Cloud Foundry and Kubernetes clusters from a single management UI.'
  },
  {
    title: 'Extensible',
    image: 'img/extend.svg',
    description:
      'Stratos is built with extensibility in mind and we continue to expand and improve the extensibility experience for developers.'
  },
  {
    title: 'Open Source',
    image: 'img/open-source.svg',
    description:
      "Stratos is Open Source with an Apache 2.0 License. Our code lives on GitHub and we're a project within the Cloud Foundry Foundation."
  },
  {
    title: 'Easy to Deploy',
    image: 'img/deploy.svg',
    description:
      'Stratos is easy to deploy and can be pushed as an application to Cloud Foundry, deployed to Kubernetes using Helm or run locally in a Docker container.'
  }
]

function Feature({ image, title, description }) {
  return (
    <div className='text-center'>
      <img className='mx-auto mb-4 h-24 w-24 object-contain' src={useBaseUrl(image)} alt='' />
      <p className='mb-2 text-xl font-bold'>{title}</p>
      <p className='mx-auto max-w-sm'>{description}</p>
    </div>
  )
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title='Home'
      description='Stratos - Web-based Management Interface for Cloud Foundry and Kubernetes'
    >
      <main>
        <div className='px-4 py-12 sm:py-16'>
          <div className='mx-auto max-w-7xl text-center'>
            <img
              className='mx-auto mb-6 h-24 w-24'
              src={useBaseUrl('img/logo.png')}
              alt='Stratos logo'
            />
            <h1 className='mb-4 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl dark:text-white'>
              {siteConfig.title}
            </h1>
            <p className='mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300'>
              Open-Source Multi-Cluster UI for
              <br />
              Cloud Foundry and Kubernetes
            </p>
            <Link
              className='button button--primary button--lg'
              to={useBaseUrl('docs/')}
            >
              Get Started
            </Link>
          </div>
        </div>
        <section className='py-10'>
          <div className='mx-auto max-w-7xl px-4'>
            <div className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
