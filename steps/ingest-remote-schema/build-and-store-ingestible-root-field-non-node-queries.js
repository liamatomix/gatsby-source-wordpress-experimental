"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.buildNonNodeQueries = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../store"));

var _recursivelyTransformFields = _interopRequireDefault(require("./build-queries-from-introspection/recursively-transform-fields"));

var _buildQueryOnFieldName = require("./build-queries-from-introspection/build-query-on-field-name");

const buildNonNodeQueries = async () => {
  const {
    remoteSchema: {
      ingestibles: {
        nonNodeRootFields
      }
    }
  } = _store.default.getState();

  const fragments = {}; // recursively transform fields

  const transformedFields = (0, _recursivelyTransformFields.default)({
    fields: nonNodeRootFields,
    parentType: {
      name: `RootQuery`,
      type: `OBJECT`
    },
    fragments
  });
  const selectionSet = (0, _buildQueryOnFieldName.buildSelectionSet)(transformedFields);
  const builtFragments = (0, _buildQueryOnFieldName.generateReusableFragments)({
    fragments,
    selectionSet
  });
  const nonNodeQuery = `
      query NON_NODE_QUERY {
        ${selectionSet}
      }
      ${builtFragments}
  `;

  _store.default.dispatch.remoteSchema.setState({
    nonNodeQuery
  });
};

exports.buildNonNodeQueries = buildNonNodeQueries;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdGVwcy9pbmdlc3QtcmVtb3RlLXNjaGVtYS9idWlsZC1hbmQtc3RvcmUtaW5nZXN0aWJsZS1yb290LWZpZWxkLW5vbi1ub2RlLXF1ZXJpZXMuanMiXSwibmFtZXMiOlsiYnVpbGROb25Ob2RlUXVlcmllcyIsInJlbW90ZVNjaGVtYSIsImluZ2VzdGlibGVzIiwibm9uTm9kZVJvb3RGaWVsZHMiLCJzdG9yZSIsImdldFN0YXRlIiwiZnJhZ21lbnRzIiwidHJhbnNmb3JtZWRGaWVsZHMiLCJmaWVsZHMiLCJwYXJlbnRUeXBlIiwibmFtZSIsInR5cGUiLCJzZWxlY3Rpb25TZXQiLCJidWlsdEZyYWdtZW50cyIsIm5vbk5vZGVRdWVyeSIsImRpc3BhdGNoIiwic2V0U3RhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUdBLE1BQU1BLG1CQUFtQixHQUFHLFlBQVk7QUFDdEMsUUFBTTtBQUNKQyxJQUFBQSxZQUFZLEVBQUU7QUFDWkMsTUFBQUEsV0FBVyxFQUFFO0FBQUVDLFFBQUFBO0FBQUY7QUFERDtBQURWLE1BSUZDLGVBQU1DLFFBQU4sRUFKSjs7QUFNQSxRQUFNQyxTQUFTLEdBQUcsRUFBbEIsQ0FQc0MsQ0FTdEM7O0FBQ0EsUUFBTUMsaUJBQWlCLEdBQUcseUNBQTJCO0FBQ25EQyxJQUFBQSxNQUFNLEVBQUVMLGlCQUQyQztBQUVuRE0sSUFBQUEsVUFBVSxFQUFFO0FBQ1ZDLE1BQUFBLElBQUksRUFBRyxXQURHO0FBRVZDLE1BQUFBLElBQUksRUFBRztBQUZHLEtBRnVDO0FBTW5ETCxJQUFBQTtBQU5tRCxHQUEzQixDQUExQjtBQVNBLFFBQU1NLFlBQVksR0FBRyw4Q0FBa0JMLGlCQUFsQixDQUFyQjtBQUVBLFFBQU1NLGNBQWMsR0FBRyxzREFBMEI7QUFDL0NQLElBQUFBLFNBRCtDO0FBRS9DTSxJQUFBQTtBQUYrQyxHQUExQixDQUF2QjtBQUtBLFFBQU1FLFlBQVksR0FBSTs7VUFFZEYsWUFBYTs7UUFFZkMsY0FBZTtHQUpyQjs7QUFPQVQsaUJBQU1XLFFBQU4sQ0FBZWQsWUFBZixDQUE0QmUsUUFBNUIsQ0FBcUM7QUFBRUYsSUFBQUE7QUFBRixHQUFyQztBQUNELENBbENEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0b3JlIGZyb20gXCJ+L3N0b3JlXCJcbmltcG9ydCByZWN1cnNpdmVseVRyYW5zZm9ybUZpZWxkcyBmcm9tIFwifi9zdGVwcy9pbmdlc3QtcmVtb3RlLXNjaGVtYS9idWlsZC1xdWVyaWVzLWZyb20taW50cm9zcGVjdGlvbi9yZWN1cnNpdmVseS10cmFuc2Zvcm0tZmllbGRzXCJcbmltcG9ydCB7IGJ1aWxkU2VsZWN0aW9uU2V0IH0gZnJvbSBcIn4vc3RlcHMvaW5nZXN0LXJlbW90ZS1zY2hlbWEvYnVpbGQtcXVlcmllcy1mcm9tLWludHJvc3BlY3Rpb24vYnVpbGQtcXVlcnktb24tZmllbGQtbmFtZVwiXG5pbXBvcnQgeyBnZW5lcmF0ZVJldXNhYmxlRnJhZ21lbnRzIH0gZnJvbSBcIi4vYnVpbGQtcXVlcmllcy1mcm9tLWludHJvc3BlY3Rpb24vYnVpbGQtcXVlcnktb24tZmllbGQtbmFtZVwiXG5cbmNvbnN0IGJ1aWxkTm9uTm9kZVF1ZXJpZXMgPSBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHtcbiAgICByZW1vdGVTY2hlbWE6IHtcbiAgICAgIGluZ2VzdGlibGVzOiB7IG5vbk5vZGVSb290RmllbGRzIH0sXG4gICAgfSxcbiAgfSA9IHN0b3JlLmdldFN0YXRlKClcblxuICBjb25zdCBmcmFnbWVudHMgPSB7fVxuXG4gIC8vIHJlY3Vyc2l2ZWx5IHRyYW5zZm9ybSBmaWVsZHNcbiAgY29uc3QgdHJhbnNmb3JtZWRGaWVsZHMgPSByZWN1cnNpdmVseVRyYW5zZm9ybUZpZWxkcyh7XG4gICAgZmllbGRzOiBub25Ob2RlUm9vdEZpZWxkcyxcbiAgICBwYXJlbnRUeXBlOiB7XG4gICAgICBuYW1lOiBgUm9vdFF1ZXJ5YCxcbiAgICAgIHR5cGU6IGBPQkpFQ1RgLFxuICAgIH0sXG4gICAgZnJhZ21lbnRzLFxuICB9KVxuXG4gIGNvbnN0IHNlbGVjdGlvblNldCA9IGJ1aWxkU2VsZWN0aW9uU2V0KHRyYW5zZm9ybWVkRmllbGRzKVxuXG4gIGNvbnN0IGJ1aWx0RnJhZ21lbnRzID0gZ2VuZXJhdGVSZXVzYWJsZUZyYWdtZW50cyh7XG4gICAgZnJhZ21lbnRzLFxuICAgIHNlbGVjdGlvblNldCxcbiAgfSlcblxuICBjb25zdCBub25Ob2RlUXVlcnkgPSBgXG4gICAgICBxdWVyeSBOT05fTk9ERV9RVUVSWSB7XG4gICAgICAgICR7c2VsZWN0aW9uU2V0fVxuICAgICAgfVxuICAgICAgJHtidWlsdEZyYWdtZW50c31cbiAgYFxuXG4gIHN0b3JlLmRpc3BhdGNoLnJlbW90ZVNjaGVtYS5zZXRTdGF0ZSh7IG5vbk5vZGVRdWVyeSB9KVxufVxuXG5leHBvcnQgeyBidWlsZE5vbk5vZGVRdWVyaWVzIH1cbiJdfQ==