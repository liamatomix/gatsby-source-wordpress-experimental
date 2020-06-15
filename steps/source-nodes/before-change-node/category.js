"use strict";

exports.__esModule = true;
exports.categoryBeforeChangeNode = void 0;

require("source-map-support/register");

var _processNode = require("../create-nodes/process-node");

const categoryBeforeChangeNode = async ({
  remoteNode,
  actionType,
  wpStore,
  fetchGraphql,
  helpers,
  actions,
  buildTypeName
}) => {
  var _remoteNode$wpChildre, _remoteNode$wpChildre2;

  if (actionType !== `UPDATE` && actionType !== `CREATE_ALL` && actionType !== `CREATE`) {
    // no need to update children if we're not updating an existing category
    // if we're creating a new category it will be empty initially.
    // so we run this function when updating nodes or when initially
    // creating all nodes
    return null;
  }

  if (!(remoteNode === null || remoteNode === void 0 ? void 0 : (_remoteNode$wpChildre = remoteNode.wpChildren) === null || _remoteNode$wpChildre === void 0 ? void 0 : (_remoteNode$wpChildre2 = _remoteNode$wpChildre.nodes) === null || _remoteNode$wpChildre2 === void 0 ? void 0 : _remoteNode$wpChildre2.length)) {
    // if we don't have any child category items to fetch, skip out
    return null;
  }

  const state = wpStore.getState();
  const {
    selectionSet
  } = state.remoteSchema.nodeQueries.categories;
  const {
    wpUrl
  } = state.remoteSchema;
  const {
    pluginOptions
  } = state.gatsbyApi;
  const query = `
        fragment CATEGORY_FIELDS on Category {
          ${selectionSet}
        }

        query {
            ${remoteNode.wpChildren.nodes.map(({
    id
  }, index) => `id__${index}: category(id: "${id}") { ...CATEGORY_FIELDS }`).join(` `)}
          }`;
  const {
    data
  } = await fetchGraphql({
    query
  });
  const remoteChildCategoryNodes = Object.values(data);
  const additionalNodeIds = remoteChildCategoryNodes.map(({
    id
  } = {}) => id);
  await Promise.all(remoteChildCategoryNodes.map(async remoteCategoryNode => {
    var _remoteCategoryNode$w, _remoteCategoryNode$w2;

    if (remoteCategoryNode === null || remoteCategoryNode === void 0 ? void 0 : (_remoteCategoryNode$w = remoteCategoryNode.wpChildren) === null || _remoteCategoryNode$w === void 0 ? void 0 : (_remoteCategoryNode$w2 = _remoteCategoryNode$w.nodes) === null || _remoteCategoryNode$w2 === void 0 ? void 0 : _remoteCategoryNode$w2.length) {
      // recursively fetch child category items
      const {
        additionalNodeIds: childNodeIds
      } = await categoryBeforeChangeNode({
        remoteNode: remoteCategoryNode,
        actionType: `CREATE`,
        wpStore,
        fetchGraphql,
        helpers,
        actions,
        buildTypeName
      });
      childNodeIds.forEach(id => additionalNodeIds.push(id));
    }

    const type = buildTypeName(`Category`);
    const processedNode = await (0, _processNode.processNode)({
      node: remoteCategoryNode,
      pluginOptions,
      wpUrl,
      helpers
    });
    await actions.createNode(Object.assign({}, processedNode, {
      nodeType: `Category`,
      type: `Category`,
      parent: null,
      internal: {
        contentDigest: helpers.createContentDigest(remoteCategoryNode),
        type
      }
    }));
  }));
  return {
    additionalNodeIds
  };
};

exports.categoryBeforeChangeNode = categoryBeforeChangeNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvYmVmb3JlLWNoYW5nZS1ub2RlL2NhdGVnb3J5LmpzIl0sIm5hbWVzIjpbImNhdGVnb3J5QmVmb3JlQ2hhbmdlTm9kZSIsInJlbW90ZU5vZGUiLCJhY3Rpb25UeXBlIiwid3BTdG9yZSIsImZldGNoR3JhcGhxbCIsImhlbHBlcnMiLCJhY3Rpb25zIiwiYnVpbGRUeXBlTmFtZSIsIndwQ2hpbGRyZW4iLCJub2RlcyIsImxlbmd0aCIsInN0YXRlIiwiZ2V0U3RhdGUiLCJzZWxlY3Rpb25TZXQiLCJyZW1vdGVTY2hlbWEiLCJub2RlUXVlcmllcyIsImNhdGVnb3JpZXMiLCJ3cFVybCIsInBsdWdpbk9wdGlvbnMiLCJnYXRzYnlBcGkiLCJxdWVyeSIsIm1hcCIsImlkIiwiaW5kZXgiLCJqb2luIiwiZGF0YSIsInJlbW90ZUNoaWxkQ2F0ZWdvcnlOb2RlcyIsIk9iamVjdCIsInZhbHVlcyIsImFkZGl0aW9uYWxOb2RlSWRzIiwiUHJvbWlzZSIsImFsbCIsInJlbW90ZUNhdGVnb3J5Tm9kZSIsImNoaWxkTm9kZUlkcyIsImZvckVhY2giLCJwdXNoIiwidHlwZSIsInByb2Nlc3NlZE5vZGUiLCJub2RlIiwiY3JlYXRlTm9kZSIsIm5vZGVUeXBlIiwicGFyZW50IiwiaW50ZXJuYWwiLCJjb250ZW50RGlnZXN0IiwiY3JlYXRlQ29udGVudERpZ2VzdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUVPLE1BQU1BLHdCQUF3QixHQUFHLE9BQU87QUFDN0NDLEVBQUFBLFVBRDZDO0FBRTdDQyxFQUFBQSxVQUY2QztBQUc3Q0MsRUFBQUEsT0FINkM7QUFJN0NDLEVBQUFBLFlBSjZDO0FBSzdDQyxFQUFBQSxPQUw2QztBQU03Q0MsRUFBQUEsT0FONkM7QUFPN0NDLEVBQUFBO0FBUDZDLENBQVAsS0FRbEM7QUFBQTs7QUFDSixNQUNFTCxVQUFVLEtBQU0sUUFBaEIsSUFDQUEsVUFBVSxLQUFNLFlBRGhCLElBRUFB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QUFBRVAsSUFBQUE7QUFBRixHQUFQO0FBQ0QsQ0FoR00iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcm9jZXNzTm9kZSB9IGZyb20gXCJ+L3N0ZXBzL3NvdXJjZS1ub2Rlcy9jcmVhdGUtbm9kZXMvcHJvY2Vzcy1ub2RlXCJcblxuZXhwb3J0IGNvbnN0IGNhdGVnb3J5QmVmb3JlQ2hhbmdlTm9kZSA9IGFzeW5jICh7XG4gIHJlbW90ZU5vZGUsXG4gIGFjdGlvblR5cGUsXG4gIHdwU3RvcmUsXG4gIGZldGNoR3JhcGhxbCxcbiAgaGVscGVycyxcbiAgYWN0aW9ucyxcbiAgYnVpbGRUeXBlTmFtZSxcbn0pID0+IHtcbiAgaWYgKFxuICAgIGFjdGlvblR5cGUgIT09IGBVUERBVEVgICYmXG4gICAgYWN0aW9uVHlwZSAhPT0gYENSRUFURV9BTExgICYmXG4gICAgYWN0aW9uVHlwZSAhPT0gYENSRUFURWBcbiAgKSB7XG4gICAgLy8gbm8gbmVlZCB0byB1cGRhdGUgY2hpbGRyZW4gaWYgd2UncmUgbm90IHVwZGF0aW5nIGFuIGV4aXN0aW5nIGNhdGVnb3J5XG4gICAgLy8gaWYgd2UncmUgY3JlYXRpbmcgYSBuZXcgY2F0ZWdvcnkgaXQgd2lsbCBiZSBlbXB0eSBpbml0aWFsbHkuXG4gICAgLy8gc28gd2UgcnVuIHRoaXMgZnVuY3Rpb24gd2hlbiB1cGRhdGluZyBub2RlcyBvciB3aGVuIGluaXRpYWxseVxuICAgIC8vIGNyZWF0aW5nIGFsbCBub2Rlc1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBpZiAoIXJlbW90ZU5vZGU/LndwQ2hpbGRyZW4/Lm5vZGVzPy5sZW5ndGgpIHtcbiAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIGFueSBjaGlsZCBjYXRlZ29yeSBpdGVtcyB0byBmZXRjaCwgc2tpcCBvdXRcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSB3cFN0b3JlLmdldFN0YXRlKClcblxuICBjb25zdCB7IHNlbGVjdGlvblNldCB9ID0gc3RhdGUucmVtb3RlU2NoZW1hLm5vZGVRdWVyaWVzLmNhdGVnb3JpZXNcbiAgY29uc3QgeyB3cFVybCB9ID0gc3RhdGUucmVtb3RlU2NoZW1hXG4gIGNvbnN0IHsgcGx1Z2luT3B0aW9ucyB9ID0gc3RhdGUuZ2F0c2J5QXBpXG5cbiAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgIGZyYWdtZW50IENBVEVHT1JZX0ZJRUxEUyBvbiBDYXRlZ29yeSB7XG4gICAgICAgICAgJHtzZWxlY3Rpb25TZXR9XG4gICAgICAgIH1cblxuICAgICAgICBxdWVyeSB7XG4gICAgICAgICAgICAke3JlbW90ZU5vZGUud3BDaGlsZHJlbi5ub2Rlc1xuICAgICAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICAgICh7IGlkIH0sIGluZGV4KSA9PlxuICAgICAgICAgICAgICAgICAgYGlkX18ke2luZGV4fTogY2F0ZWdvcnkoaWQ6IFwiJHtpZH1cIikgeyAuLi5DQVRFR09SWV9GSUVMRFMgfWBcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAuam9pbihgIGApfVxuICAgICAgICAgIH1gXG5cbiAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCBmZXRjaEdyYXBocWwoe1xuICAgIHF1ZXJ5LFxuICB9KVxuXG4gIGNvbnN0IHJlbW90ZUNoaWxkQ2F0ZWdvcnlOb2RlcyA9IE9iamVjdC52YWx1ZXMoZGF0YSlcblxuICBjb25zdCBhZGRpdGlvbmFsTm9kZUlkcyA9IHJlbW90ZUNoaWxkQ2F0ZWdvcnlOb2Rlcy5tYXAoKHsgaWQgfSA9IHt9KSA9PiBpZClcblxuICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICByZW1vdGVDaGlsZENhdGVnb3J5Tm9kZXMubWFwKGFzeW5jIChyZW1vdGVDYXRlZ29yeU5vZGUpID0+IHtcbiAgICAgIGlmIChyZW1vdGVDYXRlZ29yeU5vZGU/LndwQ2hpbGRyZW4/Lm5vZGVzPy5sZW5ndGgpIHtcbiAgICAgICAgLy8gcmVjdXJzaXZlbHkgZmV0Y2ggY2hpbGQgY2F0ZWdvcnkgaXRlbXNcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGFkZGl0aW9uYWxOb2RlSWRzOiBjaGlsZE5vZGVJZHMsXG4gICAgICAgIH0gPSBhd2FpdCBjYXRlZ29yeUJlZm9yZUNoYW5nZU5vZGUoe1xuICAgICAgICAgIHJlbW90ZU5vZGU6IHJlbW90ZUNhdGVnb3J5Tm9kZSxcbiAgICAgICAgICBhY3Rpb25UeXBlOiBgQ1JFQVRFYCxcbiAgICAgICAgICB3cFN0b3JlLFxuICAgICAgICAgIGZldGNoR3JhcGhxbCxcbiAgICAgICAgICBoZWxwZXJzLFxuICAgICAgICAgIGFjdGlvbnMsXG4gICAgICAgICAgYnVpbGRUeXBlTmFtZSxcbiAgICAgICAgfSlcblxuICAgICAgICBjaGlsZE5vZGVJZHMuZm9yRWFjaCgoaWQpID0+IGFkZGl0aW9uYWxOb2RlSWRzLnB1c2goaWQpKVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0eXBlID0gYnVpbGRUeXBlTmFtZShgQ2F0ZWdvcnlgKVxuXG4gICAgICBjb25zdCBwcm9jZXNzZWROb2RlID0gYXdhaXQgcHJvY2Vzc05vZGUoe1xuICAgICAgICBub2RlOiByZW1vdGVDYXRlZ29yeU5vZGUsXG4gICAgICAgIHBsdWdpbk9wdGlvbnMsXG4gICAgICAgIHdwVXJsLFxuICAgICAgICBoZWxwZXJzLFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgYWN0aW9ucy5jcmVhdGVOb2RlKHtcbiAgICAgICAgLi4ucHJvY2Vzc2VkTm9kZSxcbiAgICAgICAgbm9kZVR5cGU6IGBDYXRlZ29yeWAsXG4gICAgICAgIHR5cGU6IGBDYXRlZ29yeWAsXG4gICAgICAgIHBhcmVudDogbnVsbCxcbiAgICAgICAgaW50ZXJuYWw6IHtcbiAgICAgICAgICBjb250ZW50RGlnZXN0OiBoZWxwZXJzLmNyZWF0ZUNvbnRlbnREaWdlc3QocmVtb3RlQ2F0ZWdvcnlOb2RlKSxcbiAgICAgICAgICB0eXBlLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICB9KVxuICApXG5cbiAgcmV0dXJuIHsgYWRkaXRpb25hbE5vZGVJZHMgfVxufVxuIl19