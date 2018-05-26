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
