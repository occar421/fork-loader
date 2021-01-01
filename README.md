# fork-loader

[![CircleCI](https://circleci.com/gh/occar421/fork-loader.svg?style=svg)](https://circleci.com/gh/occar421/fork-loader)
[![npm version](https://img.shields.io/npm/v/fork-loader.svg)](https://www.npmjs.com/package/fork-loader)
[![license](https://img.shields.io/github/license/occar421/fork-loader.svg)](https://choosealicense.com/licenses/)

Webpack loader to fork input source into multiple down streams.

## How to use

```js
      {
        test: /\.html$/,
        rules: [
          // Do not add config here!
          {
            resourceQuery: /fork-tag=foo/, // specified this name by option "marker" of ./loader.js
            oneOf: [
              {
                resourceQuery: /fork-id=a/,
                loader: "noop-loader" // your loaders & configs
              },
              {
                resourceQuery: /fork-id=b/,
                loader: "noop-loader" // your other loaders & configs
              },
            ]
          },
          {
            loader: "fork-loader",
            options: {
              tag: 'foo',
              ids: ["a", "b"]
            },
          }
        ]
      }
```

In that config, "hoge.html" becomes both "hoge.html?tag=foo&id=a" & "hoge.html?tag=foo&id=b" and we can pass other loaders respectively.  
If you want to nest it, see `nestedCompiler` in "./test/compiler.js".

Maybe this is similar with [multi-loader](https://github.com/webpack-contrib/multi-loader).
