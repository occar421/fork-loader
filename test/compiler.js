import path from "path";
import webpack from "webpack";
import MemoryFs from "memory-fs";

export default (fixture, options) => {
  const compiler = webpack({
    context: __dirname,
    entry: path.join(__dirname, `./${fixture}`),
    module: {
      rules: [
        {
          test: /.$/, // everything
          use: {
            loader: path.resolve(__dirname, "../src/loader.js"),
            options: options
          }
        }
      ]
    }
  });

  compiler.outputFileSystem = new MemoryFs();

  return new Promise((resolve, reject) => {
    compiler.run((error, status) => {
      if (error) {
        reject(error);
      }

      resolve(status);
    });
  });
};

export const nestedCompiler = fixture => {
  const compiler = webpack({
    context: __dirname,
    entry: path.join(__dirname, `./${fixture}`),
    module: {
      rules: [
        {
          test: /.$/, // everything
          rules: [
            {
              resourceQuery: /fork-tag=foo/, // specified this name by option "marker" of ./loader.js
              oneOf: [
                {
                  resourceQuery: /fork-id=a/,
                  rules: [
                    {
                      use: {
                        loader: path.resolve(__dirname, "../src/loader.js"),
                        options: {
                          tag: "bar",
                          ids: ["b"]
                        }
                      }
                    }
                  ]
                }
              ]
            },
            {
              use: {
                loader: path.resolve(__dirname, "../src/loader.js"),
                options: {
                  tag: "foo",
                  ids: ["a"]
                }
              }
            }
          ]
        }
      ]
    }
  });

  compiler.outputFileSystem = new MemoryFs();

  return new Promise((resolve, reject) => {
    compiler.run((error, status) => {
      if (error) {
        reject(error);
      }

      resolve(status);
    });
  });
};
