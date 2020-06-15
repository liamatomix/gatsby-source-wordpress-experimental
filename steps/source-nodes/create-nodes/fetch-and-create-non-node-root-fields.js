"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../../store"));

var _fetchGraphql = _interopRequireDefault(require("../../../utils/fetch-graphql"));

var _gatsbyCoreUtils = require("gatsby-core-utils");

var _formatLogMessage = require("../../../utils/format-log-message");

const fetchAndCreateNonNodeRootFields = async () => {
  const {
    remoteSchema: {
      nonNodeQuery
    },
    gatsbyApi: {
      helpers,
      pluginOptions
    }
  } = _store.default.getState();

  const activity = helpers.reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`fetch root fields`));
  activity.start();
  const {
    data
  } = await (0, _fetchGraphql.default)({
    query: nonNodeQuery,
    ignoreGraphQLErrors: true
  });
  await helpers.actions.createNode(Object.assign({}, data, {
    id: `${pluginOptions.url}--rootfields`,
    parent: null,
    internal: {
      type: pluginOptions.schema.typePrefix,
      contentDigest: (0, _gatsbyCoreUtils.createContentDigest)(data)
    }
  }));
  activity.end();
};

var _default = fetchAndCreateNonNodeRootFields;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvY3JlYXRlLW5vZGVzL2ZldGNoLWFuZC1jcmVhdGUtbm9uLW5vZGUtcm9vdC1maWVsZHMuanMiXSwibmFtZXMiOlsiZmV0Y2hBbmRDcmVhdGVOb25Ob2RlUm9vdEZpZWxkcyIsInJlbW90ZVNjaGVtYSIsIm5vbk5vZGVRdWVyeSIsImdhdHNieUFwaSIsImhlbHBlcnMiLCJwbHVnaW5PcHRpb25zIiwic3RvcmUiLCJnZXRTdGF0ZSIsImFjdGl2aXR5IiwicmVwb3J0ZXIiLCJhY3Rpdml0eVRpbWVyIiwic3RhcnQiLCJkYXRhIiwicXVlcnkiLCJpZ25vcmVHcmFwaFFMRXJyb3JzIiwiYWN0aW9ucyIsImNyZWF0ZU5vZGUiLCJpZCIsInVybCIsInBhcmVudCIsImludGVybmFsIiwidHlwZSIsInNjaGVtYSIsInR5cGVQcmVmaXgiLCJjb250ZW50RGlnZXN0IiwiZW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSwrQkFBK0IsR0FBRyxZQUFZO0FBQ2xELFFBQU07QUFDSkMsSUFBQUEsWUFBWSxFQUFFO0FBQUVDLE1BQUFBO0FBQUYsS0FEVjtBQUVKQyxJQUFBQSxTQUFTLEVBQUU7QUFBRUMsTUFBQUEsT0FBRjtBQUFXQyxNQUFBQTtBQUFYO0FBRlAsTUFHRkMsZUFBTUMsUUFBTixFQUhKOztBQUtBLFFBQU1DLFFBQVEsR0FBR0osT0FBTyxDQUFDSyxRQUFSLENBQWlCQyxhQUFqQixDQUNmLHdDQUFrQixtQkFBbEIsQ0FEZSxDQUFqQjtBQUlBRixFQUFBQSxRQUFRLENBQUNHLEtBQVQ7QUFFQSxRQUFNO0FBQUVDLElBQUFBO0FBQUYsTUFBVyxNQUFNLDJCQUFhO0FBQ2xDQyxJQUFBQSxLQUFLLEVBQUVYLFlBRDJCO0FBRWxDWSxJQUFBQSxtQkFBbUIsRUFBRTtBQUZhLEdBQWIsQ0FBdkI7QUFLQSxRQUFNVixPQUFPLENBQUNXLE9BQVIsQ0FBZ0JDLFVBQWhCLG1CQUNESixJQURDO0FBRUpLLElBQUFBLEVBQUUsRUFBRyxHQUFFWixhQUFhLENBQUNhLEdBQUksY0FGckI7QUFHSkMsSUFBQUEsTUFBTSxFQUFFLElBSEo7QUFJSkMsSUFBQUEsUUFBUSxFQUFFO0FBQ1JDLE1BQUFBLElBQUksRUFBRWhCLGFBQWEsQ0FBQ2lCLE1BQWQsQ0FBcUJDLFVBRG5CO0FBRVJDLE1BQUFBLGFBQWEsRUFBRSwwQ0FBb0JaLElBQXBCO0FBRlA7QUFKTixLQUFOO0FBVUFKLEVBQUFBLFFBQVEsQ0FBQ2lCLEdBQVQ7QUFDRCxDQTVCRDs7ZUE4QmV6QiwrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5pbXBvcnQgZmV0Y2hHcmFwaHFsIGZyb20gXCJ+L3V0aWxzL2ZldGNoLWdyYXBocWxcIlxuaW1wb3J0IHsgY3JlYXRlQ29udGVudERpZ2VzdCB9IGZyb20gXCJnYXRzYnktY29yZS11dGlsc1wiXG5pbXBvcnQgeyBmb3JtYXRMb2dNZXNzYWdlIH0gZnJvbSBcIn4vdXRpbHMvZm9ybWF0LWxvZy1tZXNzYWdlXCJcblxuY29uc3QgZmV0Y2hBbmRDcmVhdGVOb25Ob2RlUm9vdEZpZWxkcyA9IGFzeW5jICgpID0+IHtcbiAgY29uc3Qge1xuICAgIHJlbW90ZVNjaGVtYTogeyBub25Ob2RlUXVlcnkgfSxcbiAgICBnYXRzYnlBcGk6IHsgaGVscGVycywgcGx1Z2luT3B0aW9ucyB9LFxuICB9ID0gc3RvcmUuZ2V0U3RhdGUoKVxuXG4gIGNvbnN0IGFjdGl2aXR5ID0gaGVscGVycy5yZXBvcnRlci5hY3Rpdml0eVRpbWVyKFxuICAgIGZvcm1hdExvZ01lc3NhZ2UoYGZldGNoIHJvb3QgZmllbGRzYClcbiAgKVxuXG4gIGFjdGl2aXR5LnN0YXJ0KClcblxuICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGZldGNoR3JhcGhxbCh7XG4gICAgcXVlcnk6IG5vbk5vZGVRdWVyeSxcbiAgICBpZ25vcmVHcmFwaFFMRXJyb3JzOiB0cnVlLFxuICB9KVxuXG4gIGF3YWl0IGhlbHBlcnMuYWN0aW9ucy5jcmVhdGVOb2RlKHtcbiAgICAuLi5kYXRhLFxuICAgIGlkOiBgJHtwbHVnaW5PcHRpb25zLnVybH0tLXJvb3RmaWVsZHNgLFxuICAgIHBhcmVudDogbnVsbCxcbiAgICBpbnRlcm5hbDoge1xuICAgICAgdHlwZTogcGx1Z2luT3B0aW9ucy5zY2hlbWEudHlwZVByZWZpeCxcbiAgICAgIGNvbnRlbnREaWdlc3Q6IGNyZWF0ZUNvbnRlbnREaWdlc3QoZGF0YSksXG4gICAgfSxcbiAgfSlcblxuICBhY3Rpdml0eS5lbmQoKVxufVxuXG5leHBvcnQgZGVmYXVsdCBmZXRjaEFuZENyZWF0ZU5vbk5vZGVSb290RmllbGRzXG4iXX0=