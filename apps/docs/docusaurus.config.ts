import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'React Whiteboard',
  tagline: 'A high-performance whiteboard library for React with Canvas rendering',
  favicon: 'img/favicon.ico',

  url: 'https://ozdemircibaris.github.io',
  baseUrl: '/react-whiteboard/',

  organizationName: 'ozdemircibaris',
  projectName: 'react-whiteboard',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-live-codeblock'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/ozdemircibaris/react-whiteboard/tree/main/apps/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'React Whiteboard',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/ozdemircibaris/react-whiteboard',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'API Reference', to: '/docs/api/overview' },
          ],
        },
        {
          title: 'Plugins',
          items: [
            { label: 'Custom Shapes', to: '/docs/plugins/custom-shapes' },
            { label: 'Custom Tools', to: '/docs/plugins/custom-tools' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/ozdemircibaris/react-whiteboard',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} ozdemircibaris. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
