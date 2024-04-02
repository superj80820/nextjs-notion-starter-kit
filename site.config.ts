import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '036948842f494993a50d4166bff5346d',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: '髒桶子',
  domain: 'note.messfar.com',
  author: 'York Lin',

  // open graph metadata (optional)
  description: "York Lin's blog",

  // social usernames (optional)
  twitter: 'superj80820',
  github: 'superj80820',
  linkedin: 'yorklin',
  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: "https://note.messfar.com/page-icon.png",
  defaultPageCover: "https://note.messfar.com/page-cover.jpg",
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: true,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  pageUrlOverrides: null,

  // whether to use the default notion navigation style or a custom one with links to
  // important pages. To use `navigationLinks`, set `navigationStyle` to `custom`.
  // navigationStyle: 'default'
  navigationStyle: 'custom',
  navigationLinks: [
    {
      title: '文章分類',
      pageId: 'ff9d8e74fc00469eae1c74af59227d41'
    },
    {
      title: 'Golang 教學',
      pageId: '9fabdb9d476348f59038e4c2dc8adbf5'
    },
    {
      title: '系統設計',
      pageId: 'b7a34562dc184ffdb333a7c012346899'
    },
    {
      title: '關於我',
      pageId: '3ddc5a575630411f9bd333def07f1bd7'
    }
  ]
})
