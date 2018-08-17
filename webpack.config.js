const webpack = require("webpack");
const path = require("path");
module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.(xml)$/,
        use: [
          {
            loader: "raw-loader",
            options: {}
          }
        ]
      }
    ]
  },
  mode: "development",
  watch: true
};
