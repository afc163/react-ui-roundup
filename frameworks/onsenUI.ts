import { Framework } from "../entities";

const frameworkHomepage = 'https://onsen.io';

export const onsenUI: Framework = {
  frameworkHomepage,
  frameworkId: 'onsenUI',
  repoURL: 'https://github.com/OnsenUI/OnsenUI',
  frameworkName: 'Onsen UI',
  frameworkFeaturesById: {
    darkMode: true,
    designKits: false,
    rtlSupport: false,
    themer: false,
    typeScript: true,
  },
  components: [
    {
      componentId: 'button',
      componentName: 'Button',
      componentURL: `${frameworkHomepage}/v2/api/react/Button.html`,
      options: {
        sizes: ['default', 'large'],
      },
    },
    {
      componentId: 'tabs',
      componentName: 'Tabbar',
      componentURL: `${frameworkHomepage}/v2/api/react/Tabbar.html`,
      options: {
        canBeVertical: false,
      },
    },
  ],
};