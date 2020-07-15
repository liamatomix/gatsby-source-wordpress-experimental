"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.setImageNodeIdCache = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../store"));

// since we create image nodes in resolvers
// we cache our image node id's on post build for production
// and on create dev server for development
// so we can touch our image nodes in both develop and build
// so they don't get garbage collected by Gatsby
const setImageNodeIdCache = async () => {
  const state = await _store.default.getState();
  const {
    imageNodes,
    gatsbyApi
  } = state;

  if (imageNodes.nodeIds && imageNodes.nodeIds.length) {
    await gatsbyApi.helpers.cache.set(`image-node-ids`, imageNodes.nodeIds);
  }

  if (imageNodes.nodeMetaByUrl) {
    await gatsbyApi.helpers.cache.set(`image-node-meta-by-url`, imageNodes.nodeMetaByUrl);
  }
};

exports.setImageNodeIdCache = setImageNodeIdCache;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdGVwcy9zZXQtaW1hZ2Utbm9kZS1pZC1jYWNoZS5qcyJdLCJuYW1lcyI6WyJzZXRJbWFnZU5vZGVJZENhY2hlIiwic3RhdGUiLCJzdG9yZSIsImdldFN0YXRlIiwiaW1hZ2VOb2RlcyIsImdhdHNieUFwaSIsIm5vZGVJZHMiLCJsZW5ndGgiLCJoZWxwZXJzIiwiY2FjaGUiLCJzZXQiLCJub2RlTWV0YUJ5VXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUEsbUJBQW1CLEdBQUcsWUFBWTtBQUN0QyxRQUFNQyxLQUFLLEdBQUcsTUFBTUMsZUFBTUMsUUFBTixFQUFwQjtBQUNBLFFBQU07QUFBRUMsSUFBQUEsVUFBRjtBQUFjQyxJQUFBQTtBQUFkLE1BQTRCSixLQUFsQzs7QUFFQSxNQUFJRyxVQUFVLENBQUNFLE9BQVgsSUFBc0JGLFVBQVUsQ0FBQ0UsT0FBWCxDQUFtQkMsTUFBN0MsRUFBcUQ7QUFDbkQsVUFBTUYsU0FBUyxDQUFDRyxPQUFWLENBQWtCQyxLQUFsQixDQUF3QkMsR0FBeEIsQ0FBNkIsZ0JBQTdCLEVBQThDTixVQUFVLENBQUNFLE9BQXpELENBQU47QUFDRDs7QUFFRCxNQUFJRixVQUFVLENBQUNPLGFBQWYsRUFBOEI7QUFDNUIsVUFBTU4sU0FBUyxDQUFDRyxPQUFWLENBQWtCQyxLQUFsQixDQUF3QkMsR0FBeEIsQ0FDSCx3QkFERyxFQUVKTixVQUFVLENBQUNPLGFBRlAsQ0FBTjtBQUlEO0FBQ0YsQ0FkRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5cbi8vIHNpbmNlIHdlIGNyZWF0ZSBpbWFnZSBub2RlcyBpbiByZXNvbHZlcnNcbi8vIHdlIGNhY2hlIG91ciBpbWFnZSBub2RlIGlkJ3Mgb24gcG9zdCBidWlsZCBmb3IgcHJvZHVjdGlvblxuLy8gYW5kIG9uIGNyZWF0ZSBkZXYgc2VydmVyIGZvciBkZXZlbG9wbWVudFxuLy8gc28gd2UgY2FuIHRvdWNoIG91ciBpbWFnZSBub2RlcyBpbiBib3RoIGRldmVsb3AgYW5kIGJ1aWxkXG4vLyBzbyB0aGV5IGRvbid0IGdldCBnYXJiYWdlIGNvbGxlY3RlZCBieSBHYXRzYnlcbmNvbnN0IHNldEltYWdlTm9kZUlkQ2FjaGUgPSBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHN0YXRlID0gYXdhaXQgc3RvcmUuZ2V0U3RhdGUoKVxuICBjb25zdCB7IGltYWdlTm9kZXMsIGdhdHNieUFwaSB9ID0gc3RhdGVcblxuICBpZiAoaW1hZ2VOb2Rlcy5ub2RlSWRzICYmIGltYWdlTm9kZXMubm9kZUlkcy5sZW5ndGgpIHtcbiAgICBhd2FpdCBnYXRzYnlBcGkuaGVscGVycy5jYWNoZS5zZXQoYGltYWdlLW5vZGUtaWRzYCwgaW1hZ2VOb2Rlcy5ub2RlSWRzKVxuICB9XG5cbiAgaWYgKGltYWdlTm9kZXMubm9kZU1ldGFCeVVybCkge1xuICAgIGF3YWl0IGdhdHNieUFwaS5oZWxwZXJzLmNhY2hlLnNldChcbiAgICAgIGBpbWFnZS1ub2RlLW1ldGEtYnktdXJsYCxcbiAgICAgIGltYWdlTm9kZXMubm9kZU1ldGFCeVVybFxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgeyBzZXRJbWFnZU5vZGVJZENhY2hlIH1cbiJdfQ==