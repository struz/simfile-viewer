# simfile-viewer

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Run your unit tests
```
npm run test:unit
```

### Render any helper script `.ts` to `.js`
```
npm run render-scripts
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

---

## Build an index of simfiles
```
# local
npm run index-packs
# s3
npm run index-packs-s3
```

## Override certain variables for local development
Make a file called `.env.development.local` and override the following to avoid unnecessary network traffic.
```
# Add environment variable overrides for local development here
# VUE_APP_PACK_URL_PREFIX=https://s3-us-west-2.amazonaws.com/struz.simfile-viewer/
# VUE_APP_PACK_INDEX_FILENAME=packs.json
```

## Publish to github-pages
```
npm run publish -- "changelog here"
```