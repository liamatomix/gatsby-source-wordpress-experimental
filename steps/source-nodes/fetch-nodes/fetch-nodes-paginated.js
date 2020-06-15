"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.paginatedWpNodeFetch = exports.normalizeNode = void 0;

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

require("source-map-support/register");

var _fetchGraphql = _interopRequireDefault(require("../../../utils/fetch-graphql"));

var _store = _interopRequireDefault(require("../../../store"));

const normalizeNode = ({
  node,
  nodeTypeName
}) => {
  const normalizedNodeTypeName = node.__typename || nodeTypeName; // @todo is node.type used anywhere??

  node.type = normalizedNodeTypeName; // this is used to filter node interfaces by content types

  node.nodeType = normalizedNodeTypeName;
  return node;
};
/**
 * paginatedWpNodeFetch
 *
 * recursively fetches/paginates remote nodes
 */


exports.normalizeNode = normalizeNode;

const paginatedWpNodeFetch = async (_ref) => {
  let {
    contentTypePlural,
    query,
    nodeTypeName,
    helpers,
    throwFetchErrors = false,
    allContentNodes = [],
    after = null,
    settings = {}
  } = _ref,
      variables = (0, _objectWithoutPropertiesLoose2.default)(_ref, ["contentTypePlural", "query", "nodeTypeName", "helpers", "throwFetchErrors", "allContentNodes", "after", "settings"]);

  if (!settings.limit && typeof settings.limit === `number` && settings.limit === 0) {
    // if the Type.limit plugin option is set to the number 0,
    // we shouldn't fetch anything
    return [];
  }

  if (settings.limit && // if we're about to fetch more than our limit
  allContentNodes.length + variables.first > settings.limit) {
    // just fetch whatever number is remaining
    variables.first = settings.limit - allContentNodes.length;
  } // if the GQL var "first" is greater than our Type.limit plugin option,
  // that's no good


  if (settings.limit && settings.limit < variables.first) {
    // so just fetch our limit
    variables.first = settings.limit;
  }

  const response = await (0, _fetchGraphql.default)({
    query,
    throwFetchErrors,
    variables: Object.assign({}, variables, {
      after
    }),
    errorContext: `Error occured while fetching nodes of the "${nodeTypeName}" type.`
  });
  const {
    data
  } = response;

  if (!data[contentTypePlural] || !data[contentTypePlural].nodes) {
    return allContentNodes;
  }

  let {
    [contentTypePlural]: {
      nodes,
      pageInfo: {
        hasNextPage,
        endCursor
      } = {}
    }
  } = data; // Sometimes private posts return as null.
  // That causes problems for us so let's strip them out

  nodes = nodes.filter(Boolean);

  if (nodes && nodes.length) {
    nodes.forEach(node => {
      node = normalizeNode({
        node,
        nodeTypeName
      });
      allContentNodes.push(node);
    }); // MediaItem type is incremented in createMediaItemNode

    if (nodeTypeName !== `MediaItem`) {
      _store.default.dispatch.logger.incrementActivityTimer({
        typeName: nodeTypeName,
        by: nodes.length
      });
    }
  }

  if (hasNextPage && endCursor && (!settings.limit || settings.limit > allContentNodes.length)) {
    return paginatedWpNodeFetch(Object.assign({}, variables, {
      contentTypePlural,
      nodeTypeName,
      query,
      allContentNodes,
      helpers,
      settings,
      after: endCursor
    }));
  } else {
    return allContentNodes;
  }
};

exports.paginatedWpNodeFetch = paginatedWpNodeFetch;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvZmV0Y2gtbm9kZXMvZmV0Y2gtbm9kZXMtcGFnaW5hdGVkLmpzIl0sIm5hbWVzIjpbIm5vcm1hbGl6ZU5vZGUiLCJub2RlIiwibm9kZVR5cGVOYW1lIiwibm9ybWFsaXplZE5vZGVUeXBlTmFtZSIsIl9fdHlwZW5hbWUiLCJ0eXBlIiwibm9kZVR5cGUiLCJwYWdpbmF0ZWRXcE5vZGVGZXRjaCIsImNvbnRlbnRUeXBlUGx1cmFsIiwicXVlcnkiLCJoZWxwZXJzIiwidGhyb3dGZXRjaEVycm9ycyIsImFsbENvbnRlbnROb2RlcyIsImFmdGVyIiwic2V0dGluZ3MiLCJ2YXJpYWJsZXMiLCJsaW1pdCIsImxlbmd0aCIsImZpcnN0IiwicmVzcG9uc2UiLCJlcnJvckNvbnRleHQiLCJkYXRhIiwibm9kZXMiLCJwYWdlSW5mbyIsImhhc05leHRQYWdlIiwiZW5kQ3Vyc29yIiwiZmlsdGVyIiwiQm9vbGVhbiIsImZvckVhY2giLCJwdXNoIiwic3RvcmUiLCJkaXNwYXRjaCIsImxvZ2dlciIsImluY3JlbWVudEFjdGl2aXR5VGltZXIiLCJ0eXBlTmFtZSIsImJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUVPLE1BQU1BLGFBQWEsR0FBRyxDQUFDO0FBQUVDLEVBQUFBLElBQUY7QUFBUUMsRUFBQUE7QUFBUixDQUFELEtBQTRCO0FBQ3ZELFFBQU1DLHNCQUFzQixHQUFHRixJQUFJLENBQUNHLFVBQUwsSUFBbUJGLFlBQWxELENBRHVELENBRXZEOztBQUNBRCxFQUFBQSxJQUFJLENBQUNJLElBQUwsR0FBWUYsc0JBQVosQ0FIdUQsQ0FJdkQ7O0FBQ0FGLEVBQUFBLElBQUksQ0FBQ0ssUUFBTCxHQUFnQkgsc0JBQWhCO0FBRUEsU0FBT0YsSUFBUDtBQUNELENBUk07QUFVUDs7Ozs7Ozs7O0FBS0EsTUFBTU0sb0JBQW9CLEdBQUcsZ0JBVXZCO0FBQUEsTUFWOEI7QUFDbENDLElBQUFBLGlC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QjtBQUV6QlAsTUFBQUEsaUJBRnlCO0FBR3pCTixNQUFBQSxZQUh5QjtBQUl6Qk8sTUFBQUEsS0FKeUI7QUFLekJHLE1BQUFBLGVBTHlCO0FBTXpCRixNQUFBQSxPQU55QjtBQU96QkksTUFBQUEsUUFQeUI7QUFRekJELE1BQUFBLEtBQUssRUFBRVk7QUFSa0IsT0FBM0I7QUFVRCxHQWZELE1BZU87QUFDTCxXQUFPYixlQUFQO0FBQ0Q7QUFDRixDQTlGRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmZXRjaEdyYXBocWwgZnJvbSBcIn4vdXRpbHMvZmV0Y2gtZ3JhcGhxbFwiXG5pbXBvcnQgc3RvcmUgZnJvbSBcIn4vc3RvcmVcIlxuXG5leHBvcnQgY29uc3Qgbm9ybWFsaXplTm9kZSA9ICh7IG5vZGUsIG5vZGVUeXBlTmFtZSB9KSA9PiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWROb2RlVHlwZU5hbWUgPSBub2RlLl9fdHlwZW5hbWUgfHwgbm9kZVR5cGVOYW1lXG4gIC8vIEB0b2RvIGlzIG5vZGUudHlwZSB1c2VkIGFueXdoZXJlPz9cbiAgbm9kZS50eXBlID0gbm9ybWFsaXplZE5vZGVUeXBlTmFtZVxuICAvLyB0aGlzIGlzIHVzZWQgdG8gZmlsdGVyIG5vZGUgaW50ZXJmYWNlcyBieSBjb250ZW50IHR5cGVzXG4gIG5vZGUubm9kZVR5cGUgPSBub3JtYWxpemVkTm9kZVR5cGVOYW1lXG5cbiAgcmV0dXJuIG5vZGVcbn1cblxuLyoqXG4gKiBwYWdpbmF0ZWRXcE5vZGVGZXRjaFxuICpcbiAqIHJlY3Vyc2l2ZWx5IGZldGNoZXMvcGFnaW5hdGVzIHJlbW90ZSBub2Rlc1xuICovXG5jb25zdCBwYWdpbmF0ZWRXcE5vZGVGZXRjaCA9IGFzeW5jICh7XG4gIGNvbnRlbnRUeXBlUGx1cmFsLFxuICBxdWVyeSxcbiAgbm9kZVR5cGVOYW1lLFxuICBoZWxwZXJzLFxuICB0aHJvd0ZldGNoRXJyb3JzID0gZmFsc2UsXG4gIGFsbENvbnRlbnROb2RlcyA9IFtdLFxuICBhZnRlciA9IG51bGwsXG4gIHNldHRpbmdzID0ge30sXG4gIC4uLnZhcmlhYmxlc1xufSkgPT4ge1xuICBpZiAoXG4gICAgIXNldHRpbmdzLmxpbWl0ICYmXG4gICAgdHlwZW9mIHNldHRpbmdzLmxpbWl0ID09PSBgbnVtYmVyYCAmJlxuICAgIHNldHRpbmdzLmxpbWl0ID09PSAwXG4gICkge1xuICAgIC8vIGlmIHRoZSBUeXBlLmxpbWl0IHBsdWdpbiBvcHRpb24gaXMgc2V0IHRvIHRoZSBudW1iZXIgMCxcbiAgICAvLyB3ZSBzaG91bGRuJ3QgZmV0Y2ggYW55dGhpbmdcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIGlmIChcbiAgICBzZXR0aW5ncy5saW1pdCAmJlxuICAgIC8vIGlmIHdlJ3JlIGFib3V0IHRvIGZldGNoIG1vcmUgdGhhbiBvdXIgbGltaXRcbiAgICBhbGxDb250ZW50Tm9kZXMubGVuZ3RoICsgdmFyaWFibGVzLmZpcnN0ID4gc2V0dGluZ3MubGltaXRcbiAgKSB7XG4gICAgLy8ganVzdCBmZXRjaCB3aGF0ZXZlciBudW1iZXIgaXMgcmVtYWluaW5nXG4gICAgdmFyaWFibGVzLmZpcnN0ID0gc2V0dGluZ3MubGltaXQgLSBhbGxDb250ZW50Tm9kZXMubGVuZ3RoXG4gIH1cblxuICAvLyBpZiB0aGUgR1FMIHZhciBcImZpcnN0XCIgaXMgZ3JlYXRlciB0aGFuIG91ciBUeXBlLmxpbWl0IHBsdWdpbiBvcHRpb24sXG4gIC8vIHRoYXQncyBubyBnb29kXG4gIGlmIChzZXR0aW5ncy5saW1pdCAmJiBzZXR0aW5ncy5saW1pdCA8IHZhcmlhYmxlcy5maXJzdCkge1xuICAgIC8vIHNvIGp1c3QgZmV0Y2ggb3VyIGxpbWl0XG4gICAgdmFyaWFibGVzLmZpcnN0ID0gc2V0dGluZ3MubGltaXRcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hHcmFwaHFsKHtcbiAgICBxdWVyeSxcbiAgICB0aHJvd0ZldGNoRXJyb3JzLFxuICAgIHZhcmlhYmxlczoge1xuICAgICAgLi4udmFyaWFibGVzLFxuICAgICAgYWZ0ZXIsXG4gICAgfSxcbiAgICBlcnJvckNvbnRleHQ6IGBFcnJvciBvY2N1cmVkIHdoaWxlIGZldGNoaW5nIG5vZGVzIG9mIHRoZSBcIiR7bm9kZVR5cGVOYW1lfVwiIHR5cGUuYCxcbiAgfSlcblxuICBjb25zdCB7IGRhdGEgfSA9IHJlc3BvbnNlXG5cbiAgaWYgKCFkYXRhW2NvbnRlbnRUeXBlUGx1cmFsXSB8fCAhZGF0YVtjb250ZW50VHlwZVBsdXJhbF0ubm9kZXMpIHtcbiAgICByZXR1cm4gYWxsQ29udGVudE5vZGVzXG4gIH1cblxuICBsZXQge1xuICAgIFtjb250ZW50VHlwZVBsdXJhbF06IHsgbm9kZXMsIHBhZ2VJbmZvOiB7IGhhc05leHRQYWdlLCBlbmRDdXJzb3IgfSA9IHt9IH0sXG4gIH0gPSBkYXRhXG5cbiAgLy8gU29tZXRpbWVzIHByaXZhdGUgcG9zdHMgcmV0dXJuIGFzIG51bGwuXG4gIC8vIFRoYXQgY2F1c2VzIHByb2JsZW1zIGZvciB1cyBzbyBsZXQncyBzdHJpcCB0aGVtIG91dFxuICBub2RlcyA9IG5vZGVzLmZpbHRlcihCb29sZWFuKVxuXG4gIGlmIChub2RlcyAmJiBub2Rlcy5sZW5ndGgpIHtcbiAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICBub2RlID0gbm9ybWFsaXplTm9kZSh7IG5vZGUsIG5vZGVUeXBlTmFtZSB9KVxuICAgICAgYWxsQ29udGVudE5vZGVzLnB1c2gobm9kZSlcbiAgICB9KVxuXG4gICAgLy8gTWVkaWFJdGVtIHR5cGUgaXMgaW5jcmVtZW50ZWQgaW4gY3JlYXRlTWVkaWFJdGVtTm9kZVxuICAgIGlmIChub2RlVHlwZU5hbWUgIT09IGBNZWRpYUl0ZW1gKSB7XG4gICAgICBzdG9yZS5kaXNwYXRjaC5sb2dnZXIuaW5jcmVtZW50QWN0aXZpdHlUaW1lcih7XG4gICAgICAgIHR5cGVOYW1lOiBub2RlVHlwZU5hbWUsXG4gICAgICAgIGJ5OiBub2Rlcy5sZW5ndGgsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBoYXNOZXh0UGFnZSAmJlxuICAgIGVuZEN1cnNvciAmJlxuICAgICghc2V0dGluZ3MubGltaXQgfHwgc2V0dGluZ3MubGltaXQgPiBhbGxDb250ZW50Tm9kZXMubGVuZ3RoKVxuICApIHtcbiAgICByZXR1cm4gcGFnaW5hdGVkV3BOb2RlRmV0Y2goe1xuICAgICAgLi4udmFyaWFibGVzLFxuICAgICAgY29udGVudFR5cGVQbHVyYWwsXG4gICAgICBub2RlVHlwZU5hbWUsXG4gICAgICBxdWVyeSxcbiAgICAgIGFsbENvbnRlbnROb2RlcyxcbiAgICAgIGhlbHBlcnMsXG4gICAgICBzZXR0aW5ncyxcbiAgICAgIGFmdGVyOiBlbmRDdXJzb3IsXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYWxsQ29udGVudE5vZGVzXG4gIH1cbn1cblxuZXhwb3J0IHsgcGFnaW5hdGVkV3BOb2RlRmV0Y2ggfVxuIl19