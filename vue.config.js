// See https://github.com/vuejs/vue-cli/tree/dev/docs/config
module.exports = {
    chainWebpack: config => {
      config
        .plugin('copy')
        .tap(args => {
          // Do not copy specific files from public into dist/ when building
          args[0][0].ignore.push('packs-dev.json')
          args[0][0].ignore.push('packs/*')
          return args
        })
      config.module
        .rule('vue')
        .use('vue-loader')
          .loader('vue-loader')
          .tap(options => {
            // Turn off hot reloading of components
            // Page still hot reloads but now it's a full refresh on save
            // This is because the vue components were remounting pixi configs when
            // their intended lifecycle was forever.
            options.hotReload = false
            return options
          })
    },
    devServer: {
      disableHostCheck: true,
    },
    publicPath: process.env.NODE_ENV === 'production' ? '/simfile-viewer/' : '/'
  }