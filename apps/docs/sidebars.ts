import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/overview',
        'api/components',
        'api/hooks',
        'api/store',
        'api/types',
        'api/utilities',
      ],
    },
    {
      type: 'category',
      label: 'Plugin Guides',
      items: [
        'plugins/custom-shapes',
        'plugins/custom-tools',
      ],
    },
  ],
}

export default sidebars
