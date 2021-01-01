import { getOptions, stringifyRequest } from "loader-utils";
import { validate } from "schema-utils";
import qs from "querystring";

const schema = {
  type: "object",
  properties: {
    tag: {
      type: "string",
    },
    ids: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
    },
  },
  required: ["ids", "tag"],
};

const shouldEmitSource = (tag, tagQuery) => {
  if (typeof tagQuery === "undefined") {
    return false;
  }
  if (typeof tagQuery === "string") {
    return tag === tagQuery;
  }
  if (Array.isArray(tagQuery)) {
    return tagQuery.includes(tag);
  }
  return false;
};

module.exports = function loader(source) {
  this.cacheable();

  const options = getOptions(this) || {};

  validate(schema, options, "No option is specified.");

  const query = qs.parse(this.resourceQuery.slice(1));

  if (shouldEmitSource(options.tag, query["fork-tag"])) {
    return source;
  }

  const requests = options.ids.map((id) => {
    const newQuery =
      this.resourceQuery + (this.resourceQuery.length === 0 ? "?" : "&") + `fork-tag=${options.tag}&fork-id=${id}`;
    return stringifyRequest(this, this.resourcePath + newQuery);
  });

  return requests.map((r) => `import ${r};`).join("\n");
};
