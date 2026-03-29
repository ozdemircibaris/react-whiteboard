import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <section style={{ padding: '2rem 0' }}>
          <div className="container">
            <div className="row">
              <div className="col col--4">
                <Heading as="h3">High Performance</Heading>
                <p>
                  Dual-canvas architecture with a static layer for shapes at rest
                  and an interactive layer for real-time manipulation. Renders
                  thousands of shapes without frame drops.
                </p>
              </div>
              <div className="col col--4">
                <Heading as="h3">Extensible</Heading>
                <p>
                  Register custom shape renderers and tools via a clean plugin API.
                  Build diagram editors, design tools, or collaborative whiteboards
                  on a solid foundation.
                </p>
              </div>
              <div className="col col--4">
                <Heading as="h3">React-Native Feel</Heading>
                <p>
                  Fully declarative React API with hooks, context providers, and
                  Zustand-backed state management. Works with React 18 and 19.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
