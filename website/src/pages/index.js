import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

const features = [
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
        Stratos sports a growing feature set for Kubernetes developers, extending its reach further
        towards providing a single-pane-of-glass for your Cloud Native application development needs.
      </>
    ),
  },
  {
    title: <>Multi-Cluster</>,
    imageUrl: 'img/multi-cluster.svg',
    description: (
      <>
        Stratos allows you to manage multiple Cloud Foundry and Kubernetes cluster from a single
        management UI
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
        Stratos is easy to deploy and can be pushed as an application to Cloud Foundry, deployed to Kubernetes using Helm
        or run locally in a Docker container
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
          <img className={clsx(styles.featureImage, cls, 'feature-img')} src={imgUrl} alt={title} />
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
        <div className="container home-intro">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <h2 className="hero__subtitle">Open-Source Multi-Cluster UI for <br/> Cloud Foundry and Kubernetes</h2>
          <div className={clsx(styles.buttons, 'get-started')}>
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
        <img class="home-logo" src="img/logo.png" />
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
        <section className={clsx(styles.features, 'screenshot-section', 'blue')}>
          <div className="container">
            <div class="screenshot">
              <img class="left" src="img/screens/cf-app.png" />
              <div>
                <h2>Cloud Foundry</h2>
                <p>Deploy and manage applications in Cloud Foundry. Stream application logs, scale applications and ssh to application instances</p>
                <p>View and manage Cloud Foundry organizations and spaces and quotas.</p>
                <p>Browse the Service Marketplace and create and manage service instances.</p>
                <p>and a whole lot more ...</p>
              </div>
            </div>
          </div>
        </section>

        <section className={clsx(styles.features, 'screenshot-section', 'white')}>
          <div className="container">
            <div class="screenshot">
              <div>
                <h2>Kubernetes</h2>
                <p>View cluster-level metadata</p>
                <p>Browse, view and install Helm Charts</p>
                <p>View Helm Releases and see relationships between Kubernetes Resources</p>
                <p>and lots more ...</p>
              </div>
              <img class="right" src="img/screens/kube-graph.png" />
            </div>
          </div>
        </section>

        <section className={clsx(styles.features, 'screenshot-section', 'blue')}>
          <div className="container">
            <div class="screenshot">
              <img class="left" src="img/screens/endpoints.png" />
              <div>
                <h2>Multi-Cluster</h2>
                <p>Add and Connect multiple Cloud Foundry and/or Kubernetes clusters.</p>
                <p>Seemlessly switch between clusters and get aggregated views across clusters.</p>
                <p>Favorite clusters and entities for easy access from the Home screen.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}

export default Home;
