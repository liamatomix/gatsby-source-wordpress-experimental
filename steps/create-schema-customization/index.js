"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createSchemaCustomization = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../store"));

var _helpers = require("./helpers");

var _buildTypes = _interopRequireDefault(require("./build-types"));

var _fetchNodes = require("../source-nodes/fetch-nodes/fetch-nodes");

var _isExcluded = require("../ingest-remote-schema/is-excluded");

/**
 * createSchemaCustomization
 */
const customizeSchema = async ({
  actions,
  schema
}) => {
  const state = _store.default.getState();

  const {
    gatsbyApi: {
      pluginOptions
    },
    remoteSchema
  } = state;
  const {
    fieldAliases,
    fieldBlacklist,
    ingestibles: {
      nonNodeRootFields
    }
  } = remoteSchema;
  let typeDefs = [];
  const gatsbyNodeTypes = (0, _fetchNodes.getGatsbyNodeTypeNames)();
  const typeBuilderApi = {
    typeDefs,
    schema,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist,
    pluginOptions
  }; // create Gatsby node types

  remoteSchema.introspectionData.__schema.types.forEach(type => {
    if ((0, _helpers.fieldOfTypeWasFetched)(type) && !(0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: type.name
    })) {
      switch (type.kind) {
        case `UNION`:
          _buildTypes.default.unionType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `INTERFACE`:
          _buildTypes.default.interfaceType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `OBJECT`:
          _buildTypes.default.objectType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `SCALAR`:
          /**
           * custom scalar types aren't imlemented currently.
           *  @todo make this hookable so sub-plugins or plugin options can add custom scalar support.
           */
          break;
      }
    }
  }); // Create non Gatsby node types by creating a single node
  // where the typename is the type prefix
  // The node fields are the non-node root fields of the remote schema
  // like so: query { prefix { ...fields } }


  _buildTypes.default.objectType(Object.assign({}, typeBuilderApi, {
    type: {
      kind: `OBJECT`,
      name: pluginOptions.schema.typePrefix,
      description: `Non-node WPGraphQL root fields.`,
      fields: nonNodeRootFields,
      interfaces: [`Node`]
    },
    isAGatsbyNode: true
  }));

  actions.createTypes(typeDefs);
};

const createSchemaCustomization = async api => {
  try {
    await customizeSchema(api);
  } catch (e) {
    api.reporter.panic(e);
  }
};

exports.createSchemaCustomization = createSchemaCustomization;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vaW5kZXguanMiXSwibmFtZXMiOlsiY3VzdG9taXplU2NoZW1hIiwiYWN0aW9ucyIsInNjaGVtYSIsInN0YXRlIiwic3RvcmUiLCJnZXRTdGF0ZSIsImdhdHNieUFwaSIsInBsdWdpbk9wdGlvbnMiLCJyZW1vdGVTY2hlbWEiLCJmaWVsZEFsaWFzZXMiLCJmaWVsZEJsYWNrbGlzdCIsImluZ2VzdGlibGVzIiwibm9uTm9kZVJvb3RGaWVsZHMiLCJ0eXBlRGVmcyIsImdhdHNieU5vZGVUeXBlcyIsInR5cGVCdWlsZGVyQXBpIiwiaW50cm9zcGVjdGlvbkRhdGEiLCJfX3NjaGVtYSIsInR5cGVzIiwiZm9yRWFjaCIsInR5cGUiLCJ0eXBlTmFtZSIsIm5hbWUiLCJraW5kIiwiYnVpbGRUeXBlIiwidW5pb25UeXBlIiwiaW50ZXJmYWNlVHlwZSIsIm9iamVjdFR5cGUiLCJ0eXBlUHJlZml4IiwiZGVzY3JpcHRpb24iLCJmaWVsZHMiLCJpbnRlcmZhY2VzIiwiaXNBR2F0c2J5Tm9kZSIsImNyZWF0ZVR5cGVzIiwiY3JlYXRlU2NoZW1hQ3VzdG9taXphdGlvbiIsImFwaSIsImUiLCJyZXBvcnRlciIsInBhbmljIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7O0FBR0EsTUFBTUEsZUFBZSxHQUFHLE9BQU87QUFBRUMsRUFBQUEsT0FBRjtBQUFXQyxFQUFBQTtBQUFYLENBQVAsS0FBK0I7QUFDckQsUUFBTUMsS0FBSyxHQUFHQyxlQUFNQyxRQUFOLEVBQWQ7O0FBRUEsUUFBTTtBQUNKQyxJQUFBQSxTQUFTLEVBQUU7QUFBRUMsTUFBQUE7QUFBRixLQURQO0FBRUpDLElBQUFBO0FBRkksTUFHRkwsS0FISjtBQUtBLFFBQU07QUFDSk0sSUFBQUEsWUFESTtBQUVKQyxJQUFBQSxjQUZJO0FBR0pDLElBQUFBLFdBQVcsRUFBRTtBQUFFQyxNQUFBQTtBQUFGO0FBSFQsTUFJRkosWUFKSjtBQU1BLE1BQUlLLFFBQVEsR0FBRyxFQUFmO0FBRUEsUUFBTUMsZUFBZSxHQUFHLHlDQUF4QjtBQUVBLFFBQU1DLGNBQWMsR0FBRztBQUNyQkYsSUFBQUEsUUFEcUI7QUFFckJYLElBQUFBLE1BRnFCO0FBR3JCWSxJQUFBQSxlQUhxQjtBQUlyQkwsSUFBQUEsWUFKcUI7QUFLckJDLElBQUFBLGNBTHFCO0FBTXJCSCxJQUFBQTtBQU5xQixHQUF2QixDQWxCcUQsQ0EyQnJEOztBQUNBQyxFQUFBQSxZQUFZLENBQUNRLGlCQUFiLENBQStCQyxRQUEvQixDQUF3Q0MsS0FBeEMsQ0FBOENDLE9BQTlDLENBQXVEQyxJQUFELElBQVU7QUFDOUQsUUFDRSxvQ0FBc0JBLElBQXRCLEtBQ0EsQ0FBQyxnQ0FBZTtBQUFFYixNQUFBQSxhQUFGO0FBQWlCYyxNQUFBQSxRQUFRLEVBQUVELElBQUksQ0FBQ0U7QUFBaEMsS0FBZixDQUZILEVBR0U7QUFDQSxjQUFRRixJQUFJLENBQUNHLElBQWI7QUFDRSxhQUFNLE9BQU47QUFDRUMsOEJBQVVDLFNBQVYsbUJBQXlCVixjQUF6QjtBQUF5Q0ssWUFBQUE7QUFBekM7O0FBQ0E7O0FBQ0YsYUFBTSxXQUFOO0FBQ0VJLDhCQUFVRSxhQUFWLG1CQUE2QlgsY0FBN0I7QUFBNkNLLFlBQUFBO0FBQTdDOztBQUNBOztBQUNGLGFBQU0sUUFBTjtBQUNFSSw4QkFBVUcsVUFBVixtQkFBMEJaLGNBQTFCO0FBQTBDSyxZQUFBQTtBQUExQzs7QUFDQTs7QUFDRixhQUFNLFFBQU47QUFDRTs7OztBQUlBO0FBZko7QUFpQkQ7QUFDRixHQXZCRCxFQTVCcUQsQ0FxRHJEO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQUksc0JBQVVHLFVBQVYsbUJBQ0taLGNBREw7QUFFRUssSUFBQUEsSUFBSSxFQUFFO0FBQ0pHLE1BQUFBLElBQUksRUFBRyxRQURIO0FBRUpELE1BQUFBLElBQUksRUFBRWYsYUFBYSxDQUFDTCxNQUFkLENBQXFCMEIsVUFGdkI7QUFHSkMsTUFBQUEsV0FBVyxFQUFHLGlDQUhWO0FBSUpDLE1BQUFBLE1BQU0sRUFBRWxCLGlCQUpKO0FBS0ptQixNQUFBQSxVQUFVLEVBQUUsQ0FBRSxNQUFGO0FBTFIsS0FGUjtBQVNFQyxJQUFBQSxhQUFhLEVBQUU7QUFUakI7O0FBWUEvQixFQUFBQSxPQUFPLENBQUNnQyxXQUFSLENBQW9CcEIsUUFBcEI7QUFDRCxDQXRFRDs7QUF3RUEsTUFBTXFCLHlCQUF5QixHQUFHLE1BQU9DLEdBQVAsSUFBZTtBQUMvQyxNQUFJO0FBQ0YsVUFBTW5DLGVBQWUsQ0FBQ21DLEdBQUQsQ0FBckI7QUFDRCxHQUZELENBRUUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1ZELElBQUFBLEdBQUcsQ0FBQ0UsUUFBSixDQUFhQyxLQUFiLENBQW1CRixDQUFuQjtBQUNEO0FBQ0YsQ0FORCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5cbmltcG9ydCB7IGZpZWxkT2ZUeXBlV2FzRmV0Y2hlZCB9IGZyb20gXCIuL2hlbHBlcnNcIlxuXG5pbXBvcnQgYnVpbGRUeXBlIGZyb20gXCIuL2J1aWxkLXR5cGVzXCJcbmltcG9ydCB7IGdldEdhdHNieU5vZGVUeXBlTmFtZXMgfSBmcm9tIFwiLi4vc291cmNlLW5vZGVzL2ZldGNoLW5vZGVzL2ZldGNoLW5vZGVzXCJcbmltcG9ydCB7IHR5cGVJc0V4Y2x1ZGVkIH0gZnJvbSBcIn4vc3RlcHMvaW5nZXN0LXJlbW90ZS1zY2hlbWEvaXMtZXhjbHVkZWRcIlxuXG4vKipcbiAqIGNyZWF0ZVNjaGVtYUN1c3RvbWl6YXRpb25cbiAqL1xuY29uc3QgY3VzdG9taXplU2NoZW1hID0gYXN5bmMgKHsgYWN0aW9ucywgc2NoZW1hIH0pID0+IHtcbiAgY29uc3Qgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpXG5cbiAgY29uc3Qge1xuICAgIGdhdHNieUFwaTogeyBwbHVnaW5PcHRpb25zIH0sXG4gICAgcmVtb3RlU2NoZW1hLFxuICB9ID0gc3RhdGVcblxuICBjb25zdCB7XG4gICAgZmllbGRBbGlhc2VzLFxuICAgIGZpZWxkQmxhY2tsaXN0LFxuICAgIGluZ2VzdGlibGVzOiB7IG5vbk5vZGVSb290RmllbGRzIH0sXG4gIH0gPSByZW1vdGVTY2hlbWFcblxuICBsZXQgdHlwZURlZnMgPSBbXVxuXG4gIGNvbnN0IGdhdHNieU5vZGVUeXBlcyA9IGdldEdhdHNieU5vZGVUeXBlTmFtZXMoKVxuXG4gIGNvbnN0IHR5cGVCdWlsZGVyQXBpID0ge1xuICAgIHR5cGVEZWZzLFxuICAgIHNjaGVtYSxcbiAgICBnYXRzYnlOb2RlVHlwZXMsXG4gICAgZmllbGRBbGlhc2VzLFxuICAgIGZpZWxkQmxhY2tsaXN0LFxuICAgIHBsdWdpbk9wdGlvbnMsXG4gIH1cblxuICAvLyBjcmVhdGUgR2F0c2J5IG5vZGUgdHlwZXNcbiAgcmVtb3RlU2NoZW1hLmludHJvc3BlY3Rpb25EYXRhLl9fc2NoZW1hLnR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICBpZiAoXG4gICAgICBmaWVsZE9mVHlwZVdhc0ZldGNoZWQodHlwZSkgJiZcbiAgICAgICF0eXBlSXNFeGNsdWRlZCh7IHBsdWdpbk9wdGlvbnMsIHR5cGVOYW1lOiB0eXBlLm5hbWUgfSlcbiAgICApIHtcbiAgICAgIHN3aXRjaCAodHlwZS5raW5kKSB7XG4gICAgICAgIGNhc2UgYFVOSU9OYDpcbiAgICAgICAgICBidWlsZFR5cGUudW5pb25UeXBlKHsgLi4udHlwZUJ1aWxkZXJBcGksIHR5cGUgfSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIGBJTlRFUkZBQ0VgOlxuICAgICAgICAgIGJ1aWxkVHlwZS5pbnRlcmZhY2VUeXBlKHsgLi4udHlwZUJ1aWxkZXJBcGksIHR5cGUgfSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIGBPQkpFQ1RgOlxuICAgICAgICAgIGJ1aWxkVHlwZS5vYmplY3RUeXBlKHsgLi4udHlwZUJ1aWxkZXJBcGksIHR5cGUgfSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIGBTQ0FMQVJgOlxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIGN1c3RvbSBzY2FsYXIgdHlwZXMgYXJlbid0IGltbGVtZW50ZWQgY3VycmVudGx5LlxuICAgICAgICAgICAqICBAdG9kbyBtYWtlIHRoaXMgaG9va2FibGUgc28gc3ViLXBsdWdpbnMgb3IgcGx1Z2luIG9wdGlvbnMgY2FuIGFkZCBjdXN0b20gc2NhbGFyIHN1cHBvcnQuXG4gICAgICAgICAgICovXG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgLy8gQ3JlYXRlIG5vbiBHYXRzYnkgbm9kZSB0eXBlcyBieSBjcmVhdGluZyBhIHNpbmdsZSBub2RlXG4gIC8vIHdoZXJlIHRoZSB0eXBlbmFtZSBpcyB0aGUgdHlwZSBwcmVmaXhcbiAgLy8gVGhlIG5vZGUgZmllbGRzIGFyZSB0aGUgbm9uLW5vZGUgcm9vdCBmaWVsZHMgb2YgdGhlIHJlbW90ZSBzY2hlbWFcbiAgLy8gbGlrZSBzbzogcXVlcnkgeyBwcmVmaXggeyAuLi5maWVsZHMgfSB9XG4gIGJ1aWxkVHlwZS5vYmplY3RUeXBlKHtcbiAgICAuLi50eXBlQnVpbGRlckFwaSxcbiAgICB0eXBlOiB7XG4gICAgICBraW5kOiBgT0JKRUNUYCxcbiAgICAgIG5hbWU6IHBsdWdpbk9wdGlvbnMuc2NoZW1hLnR5cGVQcmVmaXgsXG4gICAgICBkZXNjcmlwdGlvbjogYE5vbi1ub2RlIFdQR3JhcGhRTCByb290IGZpZWxkcy5gLFxuICAgICAgZmllbGRzOiBub25Ob2RlUm9vdEZpZWxkcyxcbiAgICAgIGludGVyZmFjZXM6IFtgTm9kZWBdLFxuICAgIH0sXG4gICAgaXNBR2F0c2J5Tm9kZTogdHJ1ZSxcbiAgfSlcblxuICBhY3Rpb25zLmNyZWF0ZVR5cGVzKHR5cGVEZWZzKVxufVxuXG5jb25zdCBjcmVhdGVTY2hlbWFDdXN0b21pemF0aW9uID0gYXN5bmMgKGFwaSkgPT4ge1xuICB0cnkge1xuICAgIGF3YWl0IGN1c3RvbWl6ZVNjaGVtYShhcGkpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhcGkucmVwb3J0ZXIucGFuaWMoZSlcbiAgfVxufVxuXG5leHBvcnQgeyBjcmVhdGVTY2hlbWFDdXN0b21pemF0aW9uIH1cbiJdfQ==