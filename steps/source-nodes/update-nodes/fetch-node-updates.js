"use strict";

exports.__esModule = true;
exports.default = exports.touchValidNodes = void 0;

require("source-map-support/register");

var _constants = require("../../../constants");

var _wpActions = require("./wp-actions");

var _formatLogMessage = require("../../../utils/format-log-message");

var _getGatsbyApi = require("../../../utils/get-gatsby-api");

const touchValidNodes = async () => {
  const {
    helpers
  } = (0, _getGatsbyApi.getGatsbyApi)();
  const {
    cache,
    actions
  } = helpers;
  let validNodeIds = await cache.get(_constants.CREATED_NODE_IDS);
  validNodeIds.forEach(nodeId => actions.touchNode({
    nodeId
  }));
};
/**
 * fetchAndApplyNodeUpdates
 *
 * uses query info (types and gql query strings) fetched/generated in
 * onPreBootstrap to ask WordPress for the latest changes, and then
 * apply creates, updates, and deletes to Gatsby nodes
 */


exports.touchValidNodes = touchValidNodes;

const fetchAndApplyNodeUpdates = async ({
  since,
  intervalRefetching
}) => {
  const {
    helpers,
    pluginOptions
  } = (0, _getGatsbyApi.getGatsbyApi)();
  const {
    cache,
    reporter
  } = helpers;
  let activity;

  if (!intervalRefetching) {
    activity = reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`pull updates since last build`));
    activity.start();
  }

  if (!since) {
    since = await cache.get(_constants.LAST_COMPLETED_SOURCE_TIME);
  } // Check with WPGQL to create, delete, or update cached WP nodes


  const {
    wpActions,
    didUpdate
  } = await (0, _wpActions.fetchAndRunWpActions)({
    since,
    intervalRefetching,
    helpers,
    pluginOptions
  });

  if ( // if we're refetching, we only want to touch all nodes
  // if something changed
  didUpdate || // if this is a regular build, we want to touch all nodes
  // so they don't get garbage collected
  !intervalRefetching) {
    await touchValidNodes();
  }

  if (!intervalRefetching) {
    activity.end();
  }

  return {
    wpActions,
    didUpdate
  };
};

var _default = fetchAndApplyNodeUpdates;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvdXBkYXRlLW5vZGVzL2ZldGNoLW5vZGUtdXBkYXRlcy5qcyJdLCJuYW1lcyI6WyJ0b3VjaFZhbGlkTm9kZXMiLCJoZWxwZXJzIiwiY2FjaGUiLCJhY3Rpb25zIiwidmFsaWROb2RlSWRzIiwiZ2V0IiwiQ1JFQVRFRF9OT0RFX0lEUyIsImZvckVhY2giLCJub2RlSWQiLCJ0b3VjaE5vZGUiLCJmZXRjaEFuZEFwcGx5Tm9kZVVwZGF0ZXMiLCJzaW5jZSIsImludGVydmFsUmVmZXRjaGluZyIsInBsdWdpbk9wdGlvbnMiLCJyZXBvcnRlciIsImFjdGl2aXR5IiwiYWN0aXZpdHlUaW1lciIsInN0YXJ0IiwiTEFTVF9DT01QTEVURURfU09VUkNFX1RJTUUiLCJ3cEFjdGlvbnMiLCJkaWRVcGRhdGUiLCJlbmQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFTyxNQUFNQSxlQUFlLEdBQUcsWUFBWTtBQUN6QyxRQUFNO0FBQUVDLElBQUFBO0FBQUYsTUFBYyxpQ0FBcEI7QUFDQSxRQUFNO0FBQUVDLElBQUFBLEtBQUY7QUFBU0MsSUFBQUE7QUFBVCxNQUFxQkYsT0FBM0I7QUFFQSxNQUFJRyxZQUFZLEdBQUcsTUFBTUYsS0FBSyxDQUFDRyxHQUFOLENBQVVDLDJCQUFWLENBQXpCO0FBQ0FGLEVBQUFBLFlBQVksQ0FBQ0csT0FBYixDQUFzQkMsTUFBRCxJQUFZTCxPQUFPLENBQUNNLFNBQVIsQ0FBa0I7QUFBRUQsSUFBQUE7QUFBRixHQUFsQixDQUFqQztBQUNELENBTk07QUFRUDs7Ozs7Ozs7Ozs7QUFPQSxNQUFNRSx3QkFBd0IsR0FBRyxPQUFPO0FBQUVDLEVBQUFBLEtBQUY7QUFBU0MsRUFBQUE7QUFBVCxDQUFQLEtBQXlDO0FBQ3hFLFFBQU07QUFBRVgsSUFBQUEsT0FBRjtBQUFXWSxJQUFBQTtBQUFYLE1BQTZCLGlDQUFuQztBQUVBLFFBQU07QUFBRVgsSUFBQUEsS0FBRjtBQUFTWSxJQUFBQTtBQUFULE1BQXNCYixPQUE1QjtBQUVBLE1BQUljLFFBQUo7O0FBRUEsTUFBSSxDQUFDSCxrQkFBTCxFQUF5QjtBQUN2QkcsSUFBQUEsUUFBUSxHQUFHRCxRQUFRLENBQUNFLGFBQVQsQ0FDVCx3Q0FBa0IsK0JBQWxCLENBRFMsQ0FBWDtBQUdBRCxJQUFBQSxRQUFRLENBQUNFLEtBQVQ7QUFDRDs7QUFFRCxNQUFJLENBQUNOLEtBQUwsRUFBWTtBQUNWQSxJQUFBQSxLQUFLLEdBQUcsTUFBTVQsS0FBSyxDQUFDRyxHQUFOLENBQVVhLHFDQUFWLENBQWQ7QUFDRCxHQWhCdUUsQ0FrQnhFOzs7QUFDQSxRQUFNO0FBQUVDLElBQUFBLFNBQUY7QUFBYUMsSUFBQUE7QUFBYixNQUEyQixNQUFNLHFDQUFxQjtBQUMxRFQsSUFBQUEsS0FEMEQ7QUFFMURDLElBQUFBLGtCQUYwRDtBQUcxRFgsSUFBQUEsT0FIMEQ7QUFJMURZLElBQUFBO0FBSjBELEdBQXJCLENBQXZDOztBQU9BLE9BQ0U7QUFDQTtBQUNBTyxFQUFBQSxTQUFTLElBQ1Q7QUFDQTtBQUNBLEdBQUNSLGtCQU5ILEVBT0U7QUFDQSxVQUFNWixlQUFlLEVBQXJCO0FBQ0Q7O0FBRUQsTUFBSSxDQUFDWSxrQkFBTCxFQUF5QjtBQUN2QkcsSUFBQUEsUUFBUSxDQUFDTSxHQUFUO0FBQ0Q7O0FBRUQsU0FBTztBQUFFRixJQUFBQSxTQUFGO0FBQWFDLElBQUFBO0FBQWIsR0FBUDtBQUNELENBMUNEOztlQTRDZVYsd0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDUkVBVEVEX05PREVfSURTLCBMQVNUX0NPTVBMRVRFRF9TT1VSQ0VfVElNRSB9IGZyb20gXCJ+L2NvbnN0YW50c1wiXG5pbXBvcnQgeyBmZXRjaEFuZFJ1bldwQWN0aW9ucyB9IGZyb20gXCIuL3dwLWFjdGlvbnNcIlxuaW1wb3J0IHsgZm9ybWF0TG9nTWVzc2FnZSB9IGZyb20gXCJ+L3V0aWxzL2Zvcm1hdC1sb2ctbWVzc2FnZVwiXG5pbXBvcnQgeyBnZXRHYXRzYnlBcGkgfSBmcm9tIFwifi91dGlscy9nZXQtZ2F0c2J5LWFwaVwiXG5cbmV4cG9ydCBjb25zdCB0b3VjaFZhbGlkTm9kZXMgPSBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHsgaGVscGVycyB9ID0gZ2V0R2F0c2J5QXBpKClcbiAgY29uc3QgeyBjYWNoZSwgYWN0aW9ucyB9ID0gaGVscGVyc1xuXG4gIGxldCB2YWxpZE5vZGVJZHMgPSBhd2FpdCBjYWNoZS5nZXQoQ1JFQVRFRF9OT0RFX0lEUylcbiAgdmFsaWROb2RlSWRzLmZvckVhY2goKG5vZGVJZCkgPT4gYWN0aW9ucy50b3VjaE5vZGUoeyBub2RlSWQgfSkpXG59XG5cbi8qKlxuICogZmV0Y2hBbmRBcHBseU5vZGVVcGRhdGVzXG4gKlxuICogdXNlcyBxdWVyeSBpbmZvICh0eXBlcyBhbmQgZ3FsIHF1ZXJ5IHN0cmluZ3MpIGZldGNoZWQvZ2VuZXJhdGVkIGluXG4gKiBvblByZUJvb3RzdHJhcCB0byBhc2sgV29yZFByZXNzIGZvciB0aGUgbGF0ZXN0IGNoYW5nZXMsIGFuZCB0aGVuXG4gKiBhcHBseSBjcmVhdGVzLCB1cGRhdGVzLCBhbmQgZGVsZXRlcyB0byBHYXRzYnkgbm9kZXNcbiAqL1xuY29uc3QgZmV0Y2hBbmRBcHBseU5vZGVVcGRhdGVzID0gYXN5bmMgKHsgc2luY2UsIGludGVydmFsUmVmZXRjaGluZyB9KSA9PiB7XG4gIGNvbnN0IHsgaGVscGVycywgcGx1Z2luT3B0aW9ucyB9ID0gZ2V0R2F0c2J5QXBpKClcblxuICBjb25zdCB7IGNhY2hlLCByZXBvcnRlciB9ID0gaGVscGVyc1xuXG4gIGxldCBhY3Rpdml0eVxuXG4gIGlmICghaW50ZXJ2YWxSZWZldGNoaW5nKSB7XG4gICAgYWN0aXZpdHkgPSByZXBvcnRlci5hY3Rpdml0eVRpbWVyKFxuICAgICAgZm9ybWF0TG9nTWVzc2FnZShgcHVsbCB1cGRhdGVzIHNpbmNlIGxhc3QgYnVpbGRgKVxuICAgIClcbiAgICBhY3Rpdml0eS5zdGFydCgpXG4gIH1cblxuICBpZiAoIXNpbmNlKSB7XG4gICAgc2luY2UgPSBhd2FpdCBjYWNoZS5nZXQoTEFTVF9DT01QTEVURURfU09VUkNFX1RJTUUpXG4gIH1cblxuICAvLyBDaGVjayB3aXRoIFdQR1FMIHRvIGNyZWF0ZSwgZGVsZXRlLCBvciB1cGRhdGUgY2FjaGVkIFdQIG5vZGVzXG4gIGNvbnN0IHsgd3BBY3Rpb25zLCBkaWRVcGRhdGUgfSA9IGF3YWl0IGZldGNoQW5kUnVuV3BBY3Rpb25zKHtcbiAgICBzaW5jZSxcbiAgICBpbnRlcnZhbFJlZmV0Y2hpbmcsXG4gICAgaGVscGVycyxcbiAgICBwbHVnaW5PcHRpb25zLFxuICB9KVxuXG4gIGlmIChcbiAgICAvLyBpZiB3ZSdyZSByZWZldGNoaW5nLCB3ZSBvbmx5IHdhbnQgdG8gdG91Y2ggYWxsIG5vZGVzXG4gICAgLy8gaWYgc29tZXRoaW5nIGNoYW5nZWRcbiAgICBkaWRVcGRhdGUgfHxcbiAgICAvLyBpZiB0aGlzIGlzIGEgcmVndWxhciBidWlsZCwgd2Ugd2FudCB0byB0b3VjaCBhbGwgbm9kZXNcbiAgICAvLyBzbyB0aGV5IGRvbid0IGdldCBnYXJiYWdlIGNvbGxlY3RlZFxuICAgICFpbnRlcnZhbFJlZmV0Y2hpbmdcbiAgKSB7XG4gICAgYXdhaXQgdG91Y2hWYWxpZE5vZGVzKClcbiAgfVxuXG4gIGlmICghaW50ZXJ2YWxSZWZldGNoaW5nKSB7XG4gICAgYWN0aXZpdHkuZW5kKClcbiAgfVxuXG4gIHJldHVybiB7IHdwQWN0aW9ucywgZGlkVXBkYXRlIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZmV0Y2hBbmRBcHBseU5vZGVVcGRhdGVzXG4iXX0=