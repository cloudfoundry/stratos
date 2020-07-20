import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

const features = [
  {
    title: <>Easy to Use</>,
    imageUrl: 'img/easy.svg',
    description: (
      <>
        Stratos provides an easy to use web-based management user interface
        designed to meet the needs of both administrators and developers.
      </>
    ),
  },
  {
    title: <>Cloud Foundry</>,
    imageUrl: 'img/cloudfoundry.png',
    description: (
      <>
        Stratos is the de-facto UI for Cloud Foundry, providing a rich management experience
        for all you Cloud Foundry needs... and we're an offical Cloud Foundry project too!
      </>
    ),
    cls: 'cf-logo'
  },
  {
    title: <>Kubernetes</>,
    imageUrl: 'img/kubernetes.svg',
    description: (
      <>
        Stratos sports a growing feature set for Kubernetes developers, extened its reach further
        towards providing a single-pane-of-glass for your Cloud Native application development needs.
      </>
    ),
  },
  {
    title: <>Extensible</>,
    imageUrl: 'img/extend.svg',
    description: (
      <>
        Stratos is built with extensibility in mind and we continue to expand and improve the
        extensibility experience for developers
      </>
    ),
  },
  {
    title: <>Open Source</>,
    imageUrl: 'img/open-source.svg',
    description: (
      <>
        Stratos is Open Source with an Apache 2.0 License. Our codes lives on GitHub and we're a project within
        the Cloud Foundry Foundation
      </>
    ),
  },
  {
    title: <>Easy to Deploy</>,
    imageUrl: 'img/deploy.svg',
    description: (
      <>
        Stratos is easy to deploy and can be deployed as an application to Cloud Foundry, to Kubernetes
        and run locally as a Docker container
      </>
    ),
  },


];

function Feature({imageUrl, title, description, cls}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="">
          <img className={clsx(styles.featureImage, cls)} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={`Home`}
      description="Stratos - Web-based Management Interface for Cloud Foundry and Kubernetes">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/')}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
