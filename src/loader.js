import { getOptions, stringifyRequest } from "loader-utils";
import validateOptions from "schema-utils";
import qs from "querystring";

const schema = {
  type: "object",
  properties: {
    tag: {
      type: "string"
    },
    ids: {
      type: "array",
      items: {
        type: "string"
      },
      minItems: 1
    }
  },
  required: ["ids", "tag"]
};

module.exports = function loader(source) {
  this.cacheable();

  const options = getOptions(this) || {};

  validateOptions(schema, options, "No option is specified.");

  const query = qs.parse(this.resourceQuery.slice(1));

  if (typeof query["fork-tag"] !== "undefined") {
    return source;
  }

  const requests = options.ids.map(id =>
    stringifyRequest(this, this.resourcePath + `?fork-tag=${options.tag}&fork-id=${id}`)
  );

  return requests.map(r => `import ${r};`).join("\n");
};
