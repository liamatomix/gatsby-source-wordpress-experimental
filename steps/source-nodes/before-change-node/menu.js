"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.menuBeforeChangeNode = void 0;

require("source-map-support/register");

var _pQueue = _interopRequireDefault(require("p-queue"));

var _processNode = require("../create-nodes/process-node");

var _process$env$GATSBY_C;

const menuItemFetchQueue = new _pQueue.default({
  concurrency: Number((_process$env$GATSBY_C = process.env.GATSBY_CONCURRENT_DOWNLOAD) !== null && _process$env$GATSBY_C !== void 0 ? _process$env$GATSBY_C : 200),
  carryoverConcurrencyCount: true
});

const fetchChildMenuItems = api => async () => {
  var _remoteNode$menuItems, _remoteNode$menuItems2, _remoteNode$childItem, _remoteNode$childItem2;

  const {
    remoteNode,
    wpStore,
    fetchGraphql,
    helpers,
    actions,
    buildTypeName,
    additionalNodeIds
  } = api;

  if (!(remoteNode === null || remoteNode === void 0 ? void 0 : (_remoteNode$menuItems = remoteNode.menuItems) === null || _remoteNode$menuItems === void 0 ? void 0 : (_remoteNode$menuItems2 = _remoteNode$menuItems.nodes) === null || _remoteNode$menuItems2 === void 0 ? void 0 : _remoteNode$menuItems2.length) && !(remoteNode === null || remoteNode === void 0 ? void 0 : (_remoteNode$childItem = remoteNode.childItems) === null || _remoteNode$childItem === void 0 ? void 0 : (_remoteNode$childItem2 = _remoteNode$childItem.nodes) === null || _remoteNode$childItem2 === void 0 ? void 0 : _remoteNode$childItem2.length)) {
    // if we don't have any child menu items to fetch, skip out
    return;
  }

  const state = wpStore.getState();
  const {
    selectionSet
  } = state.remoteSchema.nodeQueries.menuItems;
  const {
    wpUrl
  } = state.remoteSchema;
  const {
    pluginOptions
  } = state.gatsbyApi;
  const query =
  /* GraphQL */
  `
    fragment MENU_ITEM_FIELDS on MenuItem {
      ${selectionSet}
    }

    query {
      ${(remoteNode.menuItems || remoteNode.childItems).nodes.map(({
    id
  }, index) => `id__${index}: menuItem(id: "${id}") { ...MENU_ITEM_FIELDS }`).join(` `)}
    }`;
  const {
    data
  } = await fetchGraphql({
    query
  });
  const remoteChildMenuItemNodes = Object.values(data);
  remoteChildMenuItemNodes.forEach(({
    id
  } = {}) => id && additionalNodeIds.push(id));
  await Promise.all(remoteChildMenuItemNodes.map(async remoteMenuItemNode => {
    // recursively fetch child menu items
    menuItemFetchQueue.add(fetchChildMenuItems(Object.assign({}, api, {
      remoteNode: remoteMenuItemNode
    })));
    const type = buildTypeName(`MenuItem`);
    const processedNode = await (0, _processNode.processNode)({
      node: remoteMenuItemNode,
      pluginOptions,
      wpUrl,
      helpers
    });
    await actions.createNode(Object.assign({}, processedNode, {
      nodeType: `MenuItem`,
      type: `MenuItem`,
      parent: null,
      internal: {
        contentDigest: helpers.createContentDigest(remoteMenuItemNode),
        type
      }
    }));
  }));
};

const menuBeforeChangeNode = async api => {
  if (api.actionType !== `UPDATE` && api.actionType !== `CREATE_ALL` && api.actionType !== `CREATE`) {
    // no need to update child MenuItems if we're not updating an existing menu
    // if we're creating a new menu it will be empty initially.
    // so we run this function when updating nodes or when initially
    // creating all nodes
    return null;
  }

  let additionalNodeIds = [];
  menuItemFetchQueue.add(fetchChildMenuItems(Object.assign({}, api, {
    additionalNodeIds
  })));
  await menuItemFetchQueue.onIdle();
  return {
    additionalNodeIds
  };
};

exports.menuBeforeChangeNode = menuBeforeChangeNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvYmVmb3JlLWNoYW5nZS1ub2RlL21lbnUuanMiXSwibmFtZXMiOlsibWVudUl0ZW1GZXRjaFF1ZXVlIiwiUFF1ZXVlIiwiY29uY3VycmVuY3kiLCJOdW1iZXIiLCJwcm9jZXNzIiwiZW52IiwiR0FUU0JZX0NPTkNVUlJFTlRfRE9XTkxPQUQiLCJjYXJyeW92ZXJDb25jdXJyZW5jeUNvdW50IiwiZmV0Y2hDaGlsZE1lbnVJdGVtcyIsImFwaSIsInJlbW90ZU5vZGUiLCJ3cFN0b3JlIiwiZmV0Y2hHcmFwaHFsIiwiaGVscGVycyIsImFjdGlvbnMiLCJidWlsZFR5cGVOYW1lIiwiYWRkaXRpb25hbE5vZGVJZHMiLCJtZW51SXRlbXMiLCJub2RlcyIsImxlbmd0aCIsImNoaWxkSXRlbXMiLCJzdGF0ZSIsImdldFN0YXRlIiwic2VsZWN0aW9uU2V0IiwicmVtb3RlU2NoZW1hIiwibm9kZVF1ZXJpZXMiLCJ3cFVybCIsInBsdWdpbk9wdGlvbnMiLCJnYXRzYnlBcGkiLCJxdWVyeSIsIm1hcCIsImlkIiwiaW5kZXgiLCJqb2luIiwiZGF0YSIsInJlbW90ZUNoaWxkTWVudUl0ZW1Ob2RlcyIsIk9iamVjdCIsInZhbHVlcyIsImZvckVhY2giLCJwdXNoIiwiUHJvbWlzZSIsImFsbCIsInJlbW90ZU1lbnVJdGVtTm9kZSIsImFkZCIsInR5cGUiLCJwcm9jZXNzZWROb2RlIiwibm9kZSIsImNyZWF0ZU5vZGUiLCJub2RlVHlwZSIsInBhcmVudCIsImludGVybmFsIiwiY29udGVudERpZ2VzdCIsImNyZWF0ZUNvbnRlbnREaWdlc3QiLCJtZW51QmVmb3JlQ2hhbmdlTm9kZSIsImFjdGlvblR5cGUiLCJvbklkbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FBRUEsTUFBTUEsa0JBQWtCLEdBQUcsSUFBSUMsZUFBSixDQUFXO0FBQ3BDQyxFQUFBQSxXQUFXLEVBQUVDLE1BQU0sMEJBQUNDLE9B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QUErQkQsQ0FoRkQ7O0FBa0ZPLE1BQU1TLG9CQUFvQixHQUFHLE1BQU81QyxHQUFQLElBQWU7QUFDakQsTUFDRUEsR0FBRyxDQUFDNkMsVUFBSixLQUFvQixRQUFwQixJQUNBN0MsR0FBRyxDQUFDNkMsVUFBSixLQUFvQixZQURwQixJQUVBN0MsR0FBRyxDQUFDNkMsVUFBSixLQUFvQixRQUh0QixFQUlFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFPLElBQVA7QUFDRDs7QUFFRCxNQUFJdEMsaUJBQWlCLEdBQUcsRUFBeEI7QUFFQWhCLEVBQUFBLGtCQUFrQixDQUFDMkMsR0FBbkIsQ0FBdUJuQyxtQkFBbUIsbUJBQU1DLEdBQU47QUFBV08sSUFBQUE7QUFBWCxLQUExQztBQUVBLFFBQU1oQixrQkFBa0IsQ0FBQ3VELE1BQW5CLEVBQU47QUFFQSxTQUFPO0FBQUV2QyxJQUFBQTtBQUFGLEdBQVA7QUFDRCxDQXBCTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQUXVldWUgZnJvbSBcInAtcXVldWVcIlxuaW1wb3J0IHsgcHJvY2Vzc05vZGUgfSBmcm9tIFwifi9zdGVwcy9zb3VyY2Utbm9kZXMvY3JlYXRlLW5vZGVzL3Byb2Nlc3Mtbm9kZVwiXG5cbmNvbnN0IG1lbnVJdGVtRmV0Y2hRdWV1ZSA9IG5ldyBQUXVldWUoe1xuICBjb25jdXJyZW5jeTogTnVtYmVyKHByb2Nlc3MuZW52LkdBVFNCWV9DT05DVVJSRU5UX0RPV05MT0FEID8/IDIwMCksXG4gIGNhcnJ5b3ZlckNvbmN1cnJlbmN5Q291bnQ6IHRydWUsXG59KVxuXG5jb25zdCBmZXRjaENoaWxkTWVudUl0ZW1zID0gKGFwaSkgPT4gYXN5bmMgKCkgPT4ge1xuICBjb25zdCB7XG4gICAgcmVtb3RlTm9kZSxcbiAgICB3cFN0b3JlLFxuICAgIGZldGNoR3JhcGhxbCxcbiAgICBoZWxwZXJzLFxuICAgIGFjdGlvbnMsXG4gICAgYnVpbGRUeXBlTmFtZSxcbiAgICBhZGRpdGlvbmFsTm9kZUlkcyxcbiAgfSA9IGFwaVxuXG4gIGlmIChcbiAgICAhcmVtb3RlTm9kZT8ubWVudUl0ZW1zPy5ub2Rlcz8ubGVuZ3RoICYmXG4gICAgIXJlbW90ZU5vZGU/LmNoaWxkSXRlbXM/Lm5vZGVzPy5sZW5ndGhcbiAgKSB7XG4gICAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSBhbnkgY2hpbGQgbWVudSBpdGVtcyB0byBmZXRjaCwgc2tpcCBvdXRcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gd3BTdG9yZS5nZXRTdGF0ZSgpXG5cbiAgY29uc3QgeyBzZWxlY3Rpb25TZXQgfSA9IHN0YXRlLnJlbW90ZVNjaGVtYS5ub2RlUXVlcmllcy5tZW51SXRlbXNcbiAgY29uc3QgeyB3cFVybCB9ID0gc3RhdGUucmVtb3RlU2NoZW1hXG4gIGNvbnN0IHsgcGx1Z2luT3B0aW9ucyB9ID0gc3RhdGUuZ2F0c2J5QXBpXG5cbiAgY29uc3QgcXVlcnkgPSAvKiBHcmFwaFFMICovIGBcbiAgICBmcmFnbWVudCBNRU5VX0lURU1fRklFTERTIG9uIE1lbnVJdGVtIHtcbiAgICAgICR7c2VsZWN0aW9uU2V0fVxuICAgIH1cblxuICAgIHF1ZXJ5IHtcbiAgICAgICR7KHJlbW90ZU5vZGUubWVudUl0ZW1zIHx8IHJlbW90ZU5vZGUuY2hpbGRJdGVtcykubm9kZXNcbiAgICAgICAgLm1hcChcbiAgICAgICAgICAoeyBpZCB9LCBpbmRleCkgPT5cbiAgICAgICAgICAgIGBpZF9fJHtpbmRleH06IG1lbnVJdGVtKGlkOiBcIiR7aWR9XCIpIHsgLi4uTUVOVV9JVEVNX0ZJRUxEUyB9YFxuICAgICAgICApXG4gICAgICAgIC5qb2luKGAgYCl9XG4gICAgfWBcblxuICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGZldGNoR3JhcGhxbCh7XG4gICAgcXVlcnksXG4gIH0pXG5cbiAgY29uc3QgcmVtb3RlQ2hpbGRNZW51SXRlbU5vZGVzID0gT2JqZWN0LnZhbHVlcyhkYXRhKVxuXG4gIHJlbW90ZUNoaWxkTWVudUl0ZW1Ob2Rlcy5mb3JFYWNoKFxuICAgICh7IGlkIH0gPSB7fSkgPT4gaWQgJiYgYWRkaXRpb25hbE5vZGVJZHMucHVzaChpZClcbiAgKVxuXG4gIGF3YWl0IFByb21pc2UuYWxsKFxuICAgIHJlbW90ZUNoaWxkTWVudUl0ZW1Ob2Rlcy5tYXAoYXN5bmMgKHJlbW90ZU1lbnVJdGVtTm9kZSkgPT4ge1xuICAgICAgLy8gcmVjdXJzaXZlbHkgZmV0Y2ggY2hpbGQgbWVudSBpdGVtc1xuICAgICAgbWVudUl0ZW1GZXRjaFF1ZXVlLmFkZChcbiAgICAgICAgZmV0Y2hDaGlsZE1lbnVJdGVtcyh7XG4gICAgICAgICAgLi4uYXBpLFxuICAgICAgICAgIHJlbW90ZU5vZGU6IHJlbW90ZU1lbnVJdGVtTm9kZSxcbiAgICAgICAgfSlcbiAgICAgIClcblxuICAgICAgY29uc3QgdHlwZSA9IGJ1aWxkVHlwZU5hbWUoYE1lbnVJdGVtYClcblxuICAgICAgY29uc3QgcHJvY2Vzc2VkTm9kZSA9IGF3YWl0IHByb2Nlc3NOb2RlKHtcbiAgICAgICAgbm9kZTogcmVtb3RlTWVudUl0ZW1Ob2RlLFxuICAgICAgICBwbHVnaW5PcHRpb25zLFxuICAgICAgICB3cFVybCxcbiAgICAgICAgaGVscGVycyxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IGFjdGlvbnMuY3JlYXRlTm9kZSh7XG4gICAgICAgIC4uLnByb2Nlc3NlZE5vZGUsXG4gICAgICAgIG5vZGVUeXBlOiBgTWVudUl0ZW1gLFxuICAgICAgICB0eXBlOiBgTWVudUl0ZW1gLFxuICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICAgIGludGVybmFsOiB7XG4gICAgICAgICAgY29udGVudERpZ2VzdDogaGVscGVycy5jcmVhdGVDb250ZW50RGlnZXN0KHJlbW90ZU1lbnVJdGVtTm9kZSksXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgfSlcbiAgKVxufVxuXG5leHBvcnQgY29uc3QgbWVudUJlZm9yZUNoYW5nZU5vZGUgPSBhc3luYyAoYXBpKSA9PiB7XG4gIGlmIChcbiAgICBhcGkuYWN0aW9uVHlwZSAhPT0gYFVQREFURWAgJiZcbiAgICBhcGkuYWN0aW9uVHlwZSAhPT0gYENSRUFURV9BTExgICYmXG4gICAgYXBpLmFjdGlvblR5cGUgIT09IGBDUkVBVEVgXG4gICkge1xuICAgIC8vIG5vIG5lZWQgdG8gdXBkYXRlIGNoaWxkIE1lbnVJdGVtcyBpZiB3ZSdyZSBub3QgdXBkYXRpbmcgYW4gZXhpc3RpbmcgbWVudVxuICAgIC8vIGlmIHdlJ3JlIGNyZWF0aW5nIGEgbmV3IG1lbnUgaXQgd2lsbCBiZSBlbXB0eSBpbml0aWFsbHkuXG4gICAgLy8gc28gd2UgcnVuIHRoaXMgZnVuY3Rpb24gd2hlbiB1cGRhdGluZyBub2RlcyBvciB3aGVuIGluaXRpYWxseVxuICAgIC8vIGNyZWF0aW5nIGFsbCBub2Rlc1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBsZXQgYWRkaXRpb25hbE5vZGVJZHMgPSBbXVxuXG4gIG1lbnVJdGVtRmV0Y2hRdWV1ZS5hZGQoZmV0Y2hDaGlsZE1lbnVJdGVtcyh7IC4uLmFwaSwgYWRkaXRpb25hbE5vZGVJZHMgfSkpXG5cbiAgYXdhaXQgbWVudUl0ZW1GZXRjaFF1ZXVlLm9uSWRsZSgpXG5cbiAgcmV0dXJuIHsgYWRkaXRpb25hbE5vZGVJZHMgfVxufVxuIl19