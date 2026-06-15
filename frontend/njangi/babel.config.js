module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "@babel/plugin-syntax-import-meta",
      function() {
        return {
          visitor: {
            MemberExpression(path) {
              if (path.get("object").isMetaProperty() && path.get("property").isIdentifier({ name: "env" })) {
                path.replaceWith({
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "process" },
                  property: { type: "Identifier", name: "env" }
                });
              }
            }
          }
        };
      }
    ],
  };
};
