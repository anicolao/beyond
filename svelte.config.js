import adapter from '@sveltejs/adapter-static';
export default {
  kit: {
    adapter: adapter({ fallback: '404.html', pages: process.env.BUILD_DIRECTORY || 'build', assets: process.env.BUILD_DIRECTORY || 'build' }),
    paths: { base: process.env.PUBLIC_BASE_PATH ?? '', relative: false }
  }
};
