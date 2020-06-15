"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = fetchReferencedMediaItemsAndCreateNodes;
exports.stripImageSizesFromUrl = void 0;

require("source-map-support/register");

var _chunk = _interopRequireDefault(require("lodash/chunk"));

var _store = _interopRequireDefault(require("../../../store"));

var _atob = _interopRequireDefault(require("atob"));

var _pQueue = _interopRequireDefault(require("p-queue"));

var _createRemoteMediaItemNode = require("../create-nodes/create-remote-media-item-node");

var _formatLogMessage = require("../../../utils/format-log-message");

var _fetchNodesPaginated = require("./fetch-nodes-paginated");

var _helpers = require("../../create-schema-customization/helpers");

var _fetchGraphql = _interopRequireDefault(require("../../../utils/fetch-graphql"));

var _process$env$GATSBY_C;

const nodeFetchConcurrency = 2;
const mediaFileFetchQueue = new _pQueue.default({
  concurrency: Number((_process$env$GATSBY_C = process.env.GATSBY_CONCURRENT_DOWNLOAD) !== null && _process$env$GATSBY_C !== void 0 ? _process$env$GATSBY_C : 200) - nodeFetchConcurrency,
  carryoverConcurrencyCount: true
});
const mediaNodeFetchQueue = new _pQueue.default({
  concurrency: nodeFetchConcurrency,
  carryoverConcurrencyCount: true
});
const previouslyRetriedPromises = {};

const pushPromiseOntoRetryQueue = ({
  node,
  helpers,
  createContentDigest,
  actions,
  queue,
  retryKey,
  retryPromise
}) => {
  queue.add(async () => {
    const timesRetried = previouslyRetriedPromises[retryKey] || 0;

    if (timesRetried >= 2) {
      // if we've retried this more than once, pause for a sec.
      await new Promise(resolve => setTimeout(() => resolve(), timesRetried * 500));
    }

    try {
      await retryPromise({
        createContentDigest,
        actions,
        helpers,
        node,
        queue,
        retryKey,
        retryPromise,
        timesRetried
      });
    } catch (error) {
      // Errors that should exit are handled one level down
      // in createRemoteMediaItemNode
      //
      // if we haven't reqeued this before,
      // add it to the end of the queue to
      // try once more later
      if (timesRetried < 5) {
        if (timesRetried > 1) {
          helpers.reporter.info(`pushing ${retryKey} to the end of the request queue.`);
          helpers.reporter.info(`Previously retried ${timesRetried} times already.`);
        }

        previouslyRetriedPromises[retryKey] = timesRetried + 1;
        pushPromiseOntoRetryQueue({
          node,
          helpers,
          createContentDigest,
          actions,
          queue,
          retryKey,
          retryPromise
        });
      } else {
        helpers.reporter.info(`\n\nalready re-queued ${retryKey} 5 times :( sorry.\nTry lowering process.env.GATSBY_CONCURRENT_DOWNLOAD.\nIt's currently set to ${process.env.GATSBY_CONCURRENT_DOWNLOAD}\n\n`); // we already tried this earlier in the queue
        // no choice but to give up :(

        helpers.reporter.panic(error);
      }
    }
  });
};

const createMediaItemNode = async ({
  node,
  helpers,
  createContentDigest,
  actions,
  referencedMediaItemNodeIds,
  allMediaItemNodes = []
}) => {
  const existingNode = await helpers.getNode(node.id);

  if (existingNode) {
    return existingNode;
  }

  _store.default.dispatch.logger.incrementActivityTimer({
    typeName: `MediaItem`,
    by: 1
  });

  allMediaItemNodes.push(node);
  let resolveFutureNode;
  let futureNode = new Promise(resolve => {
    resolveFutureNode = resolve;
  });
  pushPromiseOntoRetryQueue({
    node,
    helpers,
    createContentDigest,
    actions,
    queue: mediaFileFetchQueue,
    retryKey: node.mediaItemUrl,
    retryPromise: async ({
      createContentDigest,
      actions,
      helpers,
      node,
      retryKey,
      timesRetried
    }) => {
      let localFileNode = await (0, _createRemoteMediaItemNode.createRemoteMediaItemNode)({
        mediaItemNode: node,
        fixedBarTotal: referencedMediaItemNodeIds === null || referencedMediaItemNodeIds === void 0 ? void 0 : referencedMediaItemNodeIds.length,
        helpers
      });

      if (timesRetried > 1) {
        helpers.reporter.info(`Successfully fetched ${retryKey} after retrying ${timesRetried} times`);
      }

      if (!localFileNode) {
        return;
      }

      node = Object.assign({}, node, {
        remoteFile: {
          id: localFileNode.id
        },
        localFile: {
          id: localFileNode.id
        },
        parent: null,
        internal: {
          contentDigest: createContentDigest(node),
          type: (0, _helpers.buildTypeName)(`MediaItem`)
        }
      });
      const normalizedNode = (0, _fetchNodesPaginated.normalizeNode)({
        node,
        nodeTypeName: `MediaItem`
      });
      await actions.createNode(normalizedNode);
      resolveFutureNode(node);
    }
  });
  return futureNode;
};

const stripImageSizesFromUrl = url => {
  const imageSizesPattern = new RegExp("(?:[-_]([0-9]+)x([0-9]+))");
  const urlWithoutSizes = url.replace(imageSizesPattern, "");
  return urlWithoutSizes;
}; // takes an array of image urls and returns them + additional urls if
// any of the provided image urls contain what appears to be an image resize signifier
// for ex https://site.com/wp-content/uploads/01/your-image-500x1000.jpeg
// that will add https://site.com/wp-content/uploads/01/your-image.jpeg to the array
// this is necessary because we can only get image nodes by the full source url.
// simply removing image resize signifiers from all urls would be a mistake since
// someone could upload a full-size image that contains that pattern - so the full
// size url would have 500x1000 in it, and removing it would make it so we can never
// fetch this image node.


exports.stripImageSizesFromUrl = stripImageSizesFromUrl;

const processImageUrls = urls => urls.reduce((accumulator, url) => {
  const strippedUrl = stripImageSizesFromUrl(url); // if the url had no image sizes, don't do anything special

  if (strippedUrl === url) {
    return accumulator;
  }

  accumulator.push(strippedUrl);
  return accumulator;
}, urls);

const fetchMediaItemsBySourceUrl = async ({
  mediaItemUrls,
  selectionSet,
  createContentDigest,
  actions,
  helpers,
  allMediaItemNodes = []
}) => {
  const perPage = 100;
  const processedMediaItemUrls = processImageUrls(mediaItemUrls);
  const {
    cachedMediaItemNodeIds,
    uncachedMediaItemUrls
  } = processedMediaItemUrls.reduce((accumulator, url) => {
    const {
      id
    } = (0, _createRemoteMediaItemNode.getFileNodeMetaBySourceUrl)(url) || {}; // if we have a cached image and we haven't already recorded this cached image

    if (id && !accumulator.cachedMediaItemNodeIds.includes(id)) {
      // save it
      accumulator.cachedMediaItemNodeIds.push(id);
    } else if (!id) {
      // otherwise we need to fetch this media item by url
      accumulator.uncachedMediaItemUrls.push(url);
    }

    return accumulator;
  }, {
    cachedMediaItemNodeIds: [],
    uncachedMediaItemUrls: []
  }); // take our previously cached id's and get nodes for them

  const previouslyCachedMediaItemNodes = await Promise.all(cachedMediaItemNodeIds.map(async nodeId => helpers.getNode(nodeId))); // chunk up all our uncached media items

  const mediaItemUrlsPages = (0, _chunk.default)(uncachedMediaItemUrls, perPage); // since we're using an async queue, we need a way to know when it's finished
  // we pass this resolve function into the queue function so it can let us
  // know when it's finished

  let resolveFutureNodes;
  let futureNodes = new Promise(resolve => {
    resolveFutureNodes = (nodes = []) => // combine our resolved nodes we fetched with our cached nodes
    resolve([...nodes, ...previouslyCachedMediaItemNodes]);
  }); // we have no media items to fetch,
  // so we need to resolve this promise
  // otherwise it will never resolve below.

  if (!mediaItemUrlsPages.length) {
    resolveFutureNodes();
  } // for all the images we don't have cached, loop through and get them all


  for (const [index, sourceUrls] of mediaItemUrlsPages.entries()) {
    pushPromiseOntoRetryQueue({
      helpers,
      createContentDigest,
      actions,
      queue: mediaNodeFetchQueue,
      retryKey: `Media Item by sourceUrl query #${index}`,
      retryPromise: async () => {
        const query =
        /* GraphQL */
        `
          query MEDIA_ITEMS {
            ${sourceUrls.map((sourceUrl, index) =>
        /* GraphQL */
        `
              mediaItem__index_${index}: mediaItem(id: "${sourceUrl}", idType: SOURCE_URL) {
                ...MediaItemFragment
              }
            `).join(` `)}
          }

          fragment MediaItemFragment on MediaItem {
            ${selectionSet}
          }
        `;
        const {
          data
        } = await (0, _fetchGraphql.default)({
          query,
          variables: {
            first: perPage,
            after: null
          },
          errorContext: `Error occured while fetching "MediaItem" nodes in inline html.`
        }); // since we're getting each media item on it's single node root field
        // we just needs the values of each property in the response
        // anything that returns null is because we tried to get the source url
        // plus the source url minus resize patterns. So there will be nulls
        // since only the full source url will return data

        const thisPagesNodes = Object.values(data).filter(Boolean); // take the WPGraphQL nodes we received and create Gatsby nodes out of them

        const nodes = await Promise.all(thisPagesNodes.map(node => createMediaItemNode({
          node,
          helpers,
          createContentDigest,
          actions,
          allMediaItemNodes
        })));
        nodes.forEach((node, index) => {
          // this is how we're caching nodes we've previously fetched.
          _store.default.dispatch.imageNodes.pushNodeMeta({
            id: node.localFile.id,
            sourceUrl: sourceUrls[index],
            modifiedGmt: node.modifiedGmt
          });
        });
        resolveFutureNodes(nodes);
      }
    });
  }

  await mediaNodeFetchQueue.onIdle();
  await mediaFileFetchQueue.onIdle();
  return futureNodes;
};

const fetchMediaItemsById = async ({
  mediaItemIds,
  settings,
  url,
  selectionSet,
  createContentDigest,
  actions,
  helpers,
  typeInfo
}) => {
  if (settings.limit && settings.limit < mediaItemIds.length) {
    mediaItemIds = mediaItemIds.slice(0, settings.limit);
  }

  const nodesPerFetch = 100;
  const chunkedIds = (0, _chunk.default)(mediaItemIds, nodesPerFetch);
  let resolveFutureNodes;
  let futureNodes = new Promise(resolve => {
    resolveFutureNodes = resolve;
  });
  let allMediaItemNodes = [];

  for (const [index, relayIds] of chunkedIds.entries()) {
    pushPromiseOntoRetryQueue({
      helpers,
      createContentDigest,
      actions,
      queue: mediaNodeFetchQueue,
      retryKey: `Media Item query #${index}`,
      retryPromise: async () => {
        // relay id's are base64 encoded from strings like attachment:89381
        // where 89381 is the id we want for our query
        // so we split on the : and get the last item in the array, which is the id
        // once we can get a list of media items by relay id's, we can remove atob
        const ids = relayIds.map(id => (0, _atob.default)(id).split(`:`).slice(-1)[0]);
        const query = `
          query MEDIA_ITEMS($in: [ID]) {
            mediaItems(first: ${nodesPerFetch}, where:{ in: $in }) {
              nodes {
                ${selectionSet}
              }
            }
          }
        `;
        const allNodesOfContentType = await (0, _fetchNodesPaginated.paginatedWpNodeFetch)({
          first: nodesPerFetch,
          contentTypePlural: typeInfo.pluralName,
          nodeTypeName: typeInfo.nodesTypeName,
          query,
          url,
          helpers,
          settings,
          in: ids,
          // this allows us to retry-on-end-of-queue
          throwFetchErrors: true
        });
        const nodes = await Promise.all(allNodesOfContentType.map(node => createMediaItemNode({
          node,
          helpers,
          createContentDigest,
          actions,
          allMediaItemNodes,
          referencedMediaItemNodeIds: mediaItemIds
        })));
        resolveFutureNodes(nodes);
      }
    });
  }

  await mediaNodeFetchQueue.onIdle();
  await mediaFileFetchQueue.onIdle();
  return futureNodes;
};

async function fetchReferencedMediaItemsAndCreateNodes({
  referencedMediaItemNodeIds,
  mediaItemUrls
}) {
  const state = _store.default.getState();

  const queryInfo = state.remoteSchema.nodeQueries.mediaItems;
  const {
    helpers,
    pluginOptions
  } = state.gatsbyApi;
  const {
    createContentDigest,
    actions
  } = helpers;
  const {
    url,
    verbose
  } = pluginOptions;
  const {
    typeInfo,
    settings,
    selectionSet
  } = queryInfo;
  let createdNodes = [];

  if (referencedMediaItemNodeIds === null || referencedMediaItemNodeIds === void 0 ? void 0 : referencedMediaItemNodeIds.length) {
    const nodesSourcedById = await fetchMediaItemsById({
      mediaItemIds: referencedMediaItemNodeIds,
      settings,
      url,
      selectionSet,
      createContentDigest,
      actions,
      helpers,
      typeInfo
    });
    createdNodes = nodesSourcedById;
  }

  if (mediaItemUrls === null || mediaItemUrls === void 0 ? void 0 : mediaItemUrls.length) {
    const nodesSourcedByUrl = await fetchMediaItemsBySourceUrl({
      mediaItemUrls,
      settings,
      url,
      selectionSet,
      createContentDigest,
      actions,
      helpers,
      typeInfo
    });
    createdNodes = [...createdNodes, ...nodesSourcedByUrl];
  }

  return createdNodes;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvZmV0Y2gtbm9kZXMvZmV0Y2gtcmVmZXJlbmNlZC1tZWRpYS1pdGVtcy5qcyJdLCJuYW1lcyI6WyJub2RlRmV0Y2hDb25jdXJyZW5jeSIsIm1lZGlhRmlsZUZldGNoUXVldWUiLCJQUXVldWUiLCJjb25jdXJyZW5jeSIsIk51bWJlciIsInByb2Nlc3MiLCJlbnYiLCJHQVRTQllfQ09OQ1VSUkVOVF9ET1dOTE9BRCIsImNhcnJ5b3ZlckNvbmN1cnJlbmN5Q291bnQiLCJtZWRpYU5vZGVGZXRjaFF1ZXVlIiwicHJldmlvdXNseVJldHJpZWRQcm9taXNlcyIsInB1c2hQcm9taXNlT250b1JldHJ5UXVldWUiLCJub2RlIiwiaGVscGVycyIsImNyZWF0ZUNvbnRlbnREaWdlc3QiLCJhY3Rpb25zIiwicXVldWUiLCJyZXRyeUtleSIsInJldHJ5UHJvbWlzZSIsImFkZCIsInRpbWVzUmV0cmllZCIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsImVycm9yIiwicmVwb3J0ZXIiLCJpbmZvIiwicGFuaWMiLCJjcmVhdGVNZWRpYUl0ZW1Ob2RlIiwicmVmZXJlbmNlZE1lZGlhSXRlbU5vZGVJZHMiLCJhbGxNZWRpYUl0ZW1Ob2RlcyIsImV4aXN0aW5nTm9kZSIsImdldE5vZGUiLCJpZCIsInN0b3JlIiwiZGlzcGF0Y2giLCJsb2dnZXIiLCJpbmNyZW1lbnRBY3Rpdml0eVRpbWVyIiwidHlwZU5hbWUiLCJieSIsInB1c2giLCJyZXNvbHZlRnV0dXJlTm9kZSIsImZ1dHVyZU5vZGUiLCJtZWRpYUl0ZW1VcmwiLCJsb2NhbEZpbGVOb2RlIiwibWVkaWFJdGVtTm9kZSIsImZpeGVkQmFyVG90YWwiLCJsZW5ndGgiLCJyZW1vdGVGaWxlIiwibG9jYWxGaWxlIiwicGFyZW50IiwiaW50ZXJuYWwiLCJjb250ZW50RGlnZXN0IiwidHlwZSIsIm5vcm1hbGl6ZWROb2RlIiwibm9kZVR5cGVOYW1lIiwiY3JlYXRlTm9kZSIsInN0cmlwSW1hZ2VTaXplc0Zyb21VcmwiLCJ1cmwiLCJpbWFnZVNpemVzUGF0dGVybiIsIlJlZ0V4cCIsInVybFdpdGhvdXRTaXplcyIsInJlcGxhY2UiLCJwcm9jZXNzSW1hZ2VVcmxzIiwidXJscyIsInJlZHVjZSIsImFjY3VtdWxhdG9yIiwic3RyaXBwZWRVcmwiLCJmZXRjaE1lZGlhSXRlbXNCeVNvdXJjZVVybCIsIm1lZGlhSXRlbVVybHMiLCJzZWxlY3Rpb25TZXQiLCJwZXJQYWdlIiwicHJvY2Vzc2VkTWVkaWFJdGVtVXJscyIsImNhY2hlZE1lZGlhSXRlbU5vZGVJZHMiLCJ1bmNhY2hlZE1lZGlhSXRlbVVybHMiLCJpbmNsdWRlcyIsInByZXZpb3VzbHlDYWNoZWRNZWRpYUl0ZW1Ob2RlcyIsImFsbCIsIm1hcCIsIm5vZGVJZCIsIm1lZGlhSXRlbVVybHNQYWdlcyIsInJlc29sdmVGdXR1cmVOb2RlcyIsImZ1dHVyZU5vZGVzIiwibm9kZXMiLCJpbmRleCIsInNvdXJjZVVybHMiLCJlbnRyaWVzIiwicXVlcnkiLCJzb3VyY2VVcmwiLCJqb2luIiwiZGF0YSIsInZhcmlhYmxlcyIsImZpcnN0IiwiYWZ0ZXIiLCJlcnJvckNvbnRleHQiLCJ0aGlzUGFnZXNOb2RlcyIsIk9iamVjdCIsInZhbHVlcyIsImZpbHRlciIsIkJvb2xlYW4iLCJmb3JFYWNoIiwiaW1hZ2VOb2RlcyIsInB1c2hOb2RlTWV0YSIsIm1vZGlmaWVkR210Iiwib25JZGxlIiwiZmV0Y2hNZWRpYUl0ZW1zQnlJZCIsIm1lZGlhSXRlbUlkcyIsInNldHRpbmdzIiwidHlwZUluZm8iLCJsaW1pdCIsInNsaWNlIiwibm9kZXNQZXJGZXRjaCIsImNodW5rZWRJZHMiLCJyZWxheUlkcyIsImlkcyIsInNwbGl0IiwiYWxsTm9kZXNPZkNvbnRlbnRUeXBlIiwiY29udGVudFR5cGVQbHVyYWwiLCJwbHVyYWxOYW1lIiwibm9kZXNUeXBlTmFtZSIsImluIiwidGhyb3dGZXRjaEVycm9ycyIsImZldGNoUmVmZXJlbmNlZE1lZGlhSXRlbXNBbmRDcmVhdGVOb2RlcyIsInN0YXRlIiwiZ2V0U3RhdGUiLCJxdWVyeUluZm8iLCJyZW1vdGVTY2hlbWEiLCJub2RlUXVlcmllcyIsIm1lZGlhSXRlbXMiLCJwbHVnaW5PcHRpb25zIiwiZ2F0c2J5QXBpIiwidmVyYm9zZSIsImNyZWF0ZWROb2RlcyIsIm5vZGVzU291cmNlZEJ5SWQiLCJub2Rlc1NvdXJjZWRCeVVybCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBR0EsTUFBTUEsb0JBQW9CLEdBQUcsQ0FBN0I7QUFFQSxNQUFNQyxtQkFBbUIsR0FBRyxJQUFJQyxlQUFKLENBQVc7QUFDckNDLEVBQUFBLFdBQVcsRUFDVEMsTUFBTSwwQkFBQ0MsT0FBTyxDQUFDQyxHQUFSLENBQVlDLDBCQUFiLHlFQUEyQyxHQUEzQyxDQUFOLEdBQ0FQLG9CQUhtQztBQUlyQ1EsRUFBQUEseUJBQXlCLEVBQUU7QUFKVSxDQUFYLENBQTVCO0FBT0EsTUFBTUMsbUJBQW1CLEdBQUcsSUFBSVAsZUFBSixDQUFXO0FBQ3JDQyxFQUFBQSxXQUFXLEVBQUVILG9CQUR3QjtBQUVyQ1EsRUFBQUEseUJBQXlCLEVBQUU7QUFGVSxDQUFYLENBQTVCO0FBS0EsTUFBTUUseUJBQXlCLEdBQUcsRUFBbEM7O0FBRUEsTUFBTUMseUJBQXlCLEdBQUcsQ0FBQztBQUNqQ0MsRUFBQUEsSUFEaUM7QUFFakNDLEVBQUFBLE9BRmlDO0FBR2pDQyxFQUFBQSxtQkFIaUM7QUFJakNDLEVBQUFBLE9BSmlDO0FBS2pDQyxFQUFBQSxLQUxpQztBQU1qQ0MsRUFBQUEsUUFOaUM7QUFPakNDLEVBQUFBO0FBUGlDLENBQUQsS0FRNUI7QUFDSkYsRUFBQUEsS0FBSyxDQUFDRyxHQUFOLENBQVUsWUFBWTtBQUNwQixVQUFNQyxZQUFZLEdBQUdWLHlCQUF5QixDQUFDTyxRQUFELENBQXpCLElBQXVDLENBQTVEOztBQUVBLFFBQUlHLFlBQVksSUFB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QUFZLEdBQUcsQ0FBQyxHQUFHQSxZQUFKLEVBQWtCLEdBQUdFLGlCQUFyQixDQUFmO0FBQ0Q7O0FBRUQsU0FBT0YsWUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNodW5rIGZyb20gXCJsb2Rhc2gvY2h1bmtcIlxuaW1wb3J0IHN0b3JlIGZyb20gXCJ+L3N0b3JlXCJcbmltcG9ydCBhdG9iIGZyb20gXCJhdG9iXCJcbmltcG9ydCBQUXVldWUgZnJvbSBcInAtcXVldWVcIlxuaW1wb3J0IHsgY3JlYXRlUmVtb3RlTWVkaWFJdGVtTm9kZSB9IGZyb20gXCIuLi9jcmVhdGUtbm9kZXMvY3JlYXRlLXJlbW90ZS1tZWRpYS1pdGVtLW5vZGVcIlxuaW1wb3J0IHsgZm9ybWF0TG9nTWVzc2FnZSB9IGZyb20gXCJ+L3V0aWxzL2Zvcm1hdC1sb2ctbWVzc2FnZVwiXG5pbXBvcnQgeyBwYWdpbmF0ZWRXcE5vZGVGZXRjaCwgbm9ybWFsaXplTm9kZSB9IGZyb20gXCIuL2ZldGNoLW5vZGVzLXBhZ2luYXRlZFwiXG5pbXBvcnQgeyBidWlsZFR5cGVOYW1lIH0gZnJvbSBcIn4vc3RlcHMvY3JlYXRlLXNjaGVtYS1jdXN0b21pemF0aW9uL2hlbHBlcnNcIlxuaW1wb3J0IGZldGNoR3JhcGhxbCBmcm9tIFwifi91dGlscy9mZXRjaC1ncmFwaHFsXCJcbmltcG9ydCB7IGdldEZpbGVOb2RlTWV0YUJ5U291cmNlVXJsIH0gZnJvbSBcIn4vc3RlcHMvc291cmNlLW5vZGVzL2NyZWF0ZS1ub2Rlcy9jcmVhdGUtcmVtb3RlLW1lZGlhLWl0ZW0tbm9kZVwiXG5cbmNvbnN0IG5vZGVGZXRjaENvbmN1cnJlbmN5ID0gMlxuXG5jb25zdCBtZWRpYUZpbGVGZXRjaFF1ZXVlID0gbmV3IFBRdWV1ZSh7XG4gIGNvbmN1cnJlbmN5OlxuICAgIE51bWJlcihwcm9jZXNzLmVudi5HQVRTQllfQ09OQ1VSUkVOVF9ET1dOTE9BRCA/PyAyMDApIC1cbiAgICBub2RlRmV0Y2hDb25jdXJyZW5jeSxcbiAgY2FycnlvdmVyQ29uY3VycmVuY3lDb3VudDogdHJ1ZSxcbn0pXG5cbmNvbnN0IG1lZGlhTm9kZUZldGNoUXVldWUgPSBuZXcgUFF1ZXVlKHtcbiAgY29uY3VycmVuY3k6IG5vZGVGZXRjaENvbmN1cnJlbmN5LFxuICBjYXJyeW92ZXJDb25jdXJyZW5jeUNvdW50OiB0cnVlLFxufSlcblxuY29uc3QgcHJldmlvdXNseVJldHJpZWRQcm9taXNlcyA9IHt9XG5cbmNvbnN0IHB1c2hQcm9taXNlT250b1JldHJ5UXVldWUgPSAoe1xuICBub2RlLFxuICBoZWxwZXJzLFxuICBjcmVhdGVDb250ZW50RGlnZXN0LFxuICBhY3Rpb25zLFxuICBxdWV1ZSxcbiAgcmV0cnlLZXksXG4gIHJldHJ5UHJvbWlzZSxcbn0pID0+IHtcbiAgcXVldWUuYWRkKGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0aW1lc1JldHJpZWQgPSBwcmV2aW91c2x5UmV0cmllZFByb21pc2VzW3JldHJ5S2V5XSB8fCAwXG5cbiAgICBpZiAodGltZXNSZXRyaWVkID49IDIpIHtcbiAgICAgIC8vIGlmIHdlJ3ZlIHJldHJpZWQgdGhpcyBtb3JlIHRoYW4gb25jZSwgcGF1c2UgZm9yIGEgc2VjLlxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCB0aW1lc1JldHJpZWQgKiA1MDApXG4gICAgICApXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJldHJ5UHJvbWlzZSh7XG4gICAgICAgIGNyZWF0ZUNvbnRlbnREaWdlc3QsXG4gICAgICAgIGFjdGlvbnMsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICAgIG5vZGUsXG4gICAgICAgIHF1ZXVlLFxuICAgICAgICByZXRyeUtleSxcbiAgICAgICAgcmV0cnlQcm9taXNlLFxuICAgICAgICB0aW1lc1JldHJpZWQsXG4gICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBFcnJvcnMgdGhhdCBzaG91bGQgZXhpdCBhcmUgaGFuZGxlZCBvbmUgbGV2ZWwgZG93blxuICAgICAgLy8gaW4gY3JlYXRlUmVtb3RlTWVkaWFJdGVtTm9kZVxuICAgICAgLy9cbiAgICAgIC8vIGlmIHdlIGhhdmVuJ3QgcmVxZXVlZCB0aGlzIGJlZm9yZSxcbiAgICAgIC8vIGFkZCBpdCB0byB0aGUgZW5kIG9mIHRoZSBxdWV1ZSB0b1xuICAgICAgLy8gdHJ5IG9uY2UgbW9yZSBsYXRlclxuICAgICAgaWYgKHRpbWVzUmV0cmllZCA8IDUpIHtcbiAgICAgICAgaWYgKHRpbWVzUmV0cmllZCA+IDEpIHtcbiAgICAgICAgICBoZWxwZXJzLnJlcG9ydGVyLmluZm8oXG4gICAgICAgICAgICBgcHVzaGluZyAke3JldHJ5S2V5fSB0byB0aGUgZW5kIG9mIHRoZSByZXF1ZXN0IHF1ZXVlLmBcbiAgICAgICAgICApXG5cbiAgICAgICAgICBoZWxwZXJzLnJlcG9ydGVyLmluZm8oXG4gICAgICAgICAgICBgUHJldmlvdXNseSByZXRyaWVkICR7dGltZXNSZXRyaWVkfSB0aW1lcyBhbHJlYWR5LmBcbiAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICBwcmV2aW91c2x5UmV0cmllZFByb21pc2VzW3JldHJ5S2V5XSA9IHRpbWVzUmV0cmllZCArIDFcblxuICAgICAgICBwdXNoUHJvbWlzZU9udG9SZXRyeVF1ZXVlKHtcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIGhlbHBlcnMsXG4gICAgICAgICAgY3JlYXRlQ29udGVudERpZ2VzdCxcbiAgICAgICAgICBhY3Rpb25zLFxuICAgICAgICAgIHF1ZXVlLFxuICAgICAgICAgIHJldHJ5S2V5LFxuICAgICAgICAgIHJldHJ5UHJvbWlzZSxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlbHBlcnMucmVwb3J0ZXIuaW5mbyhcbiAgICAgICAgICBgXFxuXFxuYWxyZWFkeSByZS1xdWV1ZWQgJHtyZXRyeUtleX0gNSB0aW1lcyA6KCBzb3JyeS5cXG5UcnkgbG93ZXJpbmcgcHJvY2Vzcy5lbnYuR0FUU0JZX0NPTkNVUlJFTlRfRE9XTkxPQUQuXFxuSXQncyBjdXJyZW50bHkgc2V0IHRvICR7cHJvY2Vzcy5lbnYuR0FUU0JZX0NPTkNVUlJFTlRfRE9XTkxPQUR9XFxuXFxuYFxuICAgICAgICApXG4gICAgICAgIC8vIHdlIGFscmVhZHkgdHJpZWQgdGhpcyBlYXJsaWVyIGluIHRoZSBxdWV1ZVxuICAgICAgICAvLyBubyBjaG9pY2UgYnV0IHRvIGdpdmUgdXAgOihcbiAgICAgICAgaGVscGVycy5yZXBvcnRlci5wYW5pYyhlcnJvcilcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG5cbmNvbnN0IGNyZWF0ZU1lZGlhSXRlbU5vZGUgPSBhc3luYyAoe1xuICBub2RlLFxuICBoZWxwZXJzLFxuICBjcmVhdGVDb250ZW50RGlnZXN0LFxuICBhY3Rpb25zLFxuICByZWZlcmVuY2VkTWVkaWFJdGVtTm9kZUlkcyxcbiAgYWxsTWVkaWFJdGVtTm9kZXMgPSBbXSxcbn0pID0+IHtcbiAgY29uc3QgZXhpc3RpbmdOb2RlID0gYXdhaXQgaGVscGVycy5nZXROb2RlKG5vZGUuaWQpXG5cbiAgaWYgKGV4aXN0aW5nTm9kZSkge1xuICAgIHJldHVybiBleGlzdGluZ05vZGVcbiAgfVxuXG4gIHN0b3JlLmRpc3BhdGNoLmxvZ2dlci5pbmNyZW1lbnRBY3Rpdml0eVRpbWVyKHtcbiAgICB0eXBlTmFtZTogYE1lZGlhSXRlbWAsXG4gICAgYnk6IDEsXG4gIH0pXG5cbiAgYWxsTWVkaWFJdGVtTm9kZXMucHVzaChub2RlKVxuXG4gIGxldCByZXNvbHZlRnV0dXJlTm9kZVxuICBsZXQgZnV0dXJlTm9kZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgcmVzb2x2ZUZ1dHVyZU5vZGUgPSByZXNvbHZlXG4gIH0pXG5cbiAgcHVzaFByb21pc2VPbnRvUmV0cnlRdWV1ZSh7XG4gICAgbm9kZSxcbiAgICBoZWxwZXJzLFxuICAgIGNyZWF0ZUNvbnRlbnREaWdlc3QsXG4gICAgYWN0aW9ucyxcbiAgICBxdWV1ZTogbWVkaWFGaWxlRmV0Y2hRdWV1ZSxcbiAgICByZXRyeUtleTogbm9kZS5tZWRpYUl0ZW1VcmwsXG4gICAgcmV0cnlQcm9taXNlOiBhc3luYyAoe1xuICAgICAgY3JlYXRlQ29udGVudERpZ2VzdCxcbiAgICAgIGFjdGlvbnMsXG4gICAgICBoZWxwZXJzLFxuICAgICAgbm9kZSxcbiAgICAgIHJldHJ5S2V5LFxuICAgICAgdGltZXNSZXRyaWVkLFxuICAgIH0pID0+IHtcbiAgICAgIGxldCBsb2NhbEZpbGVOb2RlID0gYXdhaXQgY3JlYXRlUmVtb3RlTWVkaWFJdGVtTm9kZSh7XG4gICAgICAgIG1lZGlhSXRlbU5vZGU6IG5vZGUsXG4gICAgICAgIGZpeGVkQmFyVG90YWw6IHJlZmVyZW5jZWRNZWRpYUl0ZW1Ob2RlSWRzPy5sZW5ndGgsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICB9KVxuXG4gICAgICBpZiAodGltZXNSZXRyaWVkID4gMSkge1xuICAgICAgICBoZWxwZXJzLnJlcG9ydGVyLmluZm8oXG4gICAgICAgICAgYFN1Y2Nlc3NmdWxseSBmZXRjaGVkICR7cmV0cnlLZXl9IGFmdGVyIHJldHJ5aW5nICR7dGltZXNSZXRyaWVkfSB0aW1lc2BcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBpZiAoIWxvY2FsRmlsZU5vZGUpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIG5vZGUgPSB7XG4gICAgICAgIC4uLm5vZGUsXG4gICAgICAgIHJlbW90ZUZpbGU6IHtcbiAgICAgICAgICBpZDogbG9jYWxGaWxlTm9kZS5pZCxcbiAgICAgICAgfSxcbiAgICAgICAgbG9jYWxGaWxlOiB7XG4gICAgICAgICAgaWQ6IGxvY2FsRmlsZU5vZGUuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHBhcmVudDogbnVsbCxcbiAgICAgICAgaW50ZXJuYWw6IHtcbiAgICAgICAgICBjb250ZW50RGlnZXN0OiBjcmVhdGVDb250ZW50RGlnZXN0KG5vZGUpLFxuICAgICAgICAgIHR5cGU6IGJ1aWxkVHlwZU5hbWUoYE1lZGlhSXRlbWApLFxuICAgICAgICB9LFxuICAgICAgfVxuXG4gICAgICBjb25zdCBub3JtYWxpemVkTm9kZSA9IG5vcm1hbGl6ZU5vZGUoeyBub2RlLCBub2RlVHlwZU5hbWU6IGBNZWRpYUl0ZW1gIH0pXG5cbiAgICAgIGF3YWl0IGFjdGlvbnMuY3JlYXRlTm9kZShub3JtYWxpemVkTm9kZSlcbiAgICAgIHJlc29sdmVGdXR1cmVOb2RlKG5vZGUpXG4gICAgfSxcbiAgfSlcblxuICByZXR1cm4gZnV0dXJlTm9kZVxufVxuXG5leHBvcnQgY29uc3Qgc3RyaXBJbWFnZVNpemVzRnJvbVVybCA9ICh1cmwpID0+IHtcbiAgY29uc3QgaW1hZ2VTaXplc1BhdHRlcm4gPSBuZXcgUmVnRXhwKFwiKD86Wy1fXShbMC05XSspeChbMC05XSspKVwiKVxuICBjb25zdCB1cmxXaXRob3V0U2l6ZXMgPSB1cmwucmVwbGFjZShpbWFnZVNpemVzUGF0dGVybiwgXCJcIilcblxuICByZXR1cm4gdXJsV2l0aG91dFNpemVzXG59XG5cbi8vIHRha2VzIGFuIGFycmF5IG9mIGltYWdlIHVybHMgYW5kIHJldHVybnMgdGhlbSArIGFkZGl0aW9uYWwgdXJscyBpZlxuLy8gYW55IG9mIHRoZSBwcm92aWRlZCBpbWFnZSB1cmxzIGNvbnRhaW4gd2hhdCBhcHBlYXJzIHRvIGJlIGFuIGltYWdlIHJlc2l6ZSBzaWduaWZpZXJcbi8vIGZvciBleCBodHRwczovL3NpdGUuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8wMS95b3VyLWltYWdlLTUwMHgxMDAwLmpwZWdcbi8vIHRoYXQgd2lsbCBhZGQgaHR0cHM6Ly9zaXRlLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMDEveW91ci1pbWFnZS5qcGVnIHRvIHRoZSBhcnJheVxuLy8gdGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBjYW4gb25seSBnZXQgaW1hZ2Ugbm9kZXMgYnkgdGhlIGZ1bGwgc291cmNlIHVybC5cbi8vIHNpbXBseSByZW1vdmluZyBpbWFnZSByZXNpemUgc2lnbmlmaWVycyBmcm9tIGFsbCB1cmxzIHdvdWxkIGJlIGEgbWlzdGFrZSBzaW5jZVxuLy8gc29tZW9uZSBjb3VsZCB1cGxvYWQgYSBmdWxsLXNpemUgaW1hZ2UgdGhhdCBjb250YWlucyB0aGF0IHBhdHRlcm4gLSBzbyB0aGUgZnVsbFxuLy8gc2l6ZSB1cmwgd291bGQgaGF2ZSA1MDB4MTAwMCBpbiBpdCwgYW5kIHJlbW92aW5nIGl0IHdvdWxkIG1ha2UgaXQgc28gd2UgY2FuIG5ldmVyXG4vLyBmZXRjaCB0aGlzIGltYWdlIG5vZGUuXG5jb25zdCBwcm9jZXNzSW1hZ2VVcmxzID0gKHVybHMpID0+XG4gIHVybHMucmVkdWNlKChhY2N1bXVsYXRvciwgdXJsKSA9PiB7XG4gICAgY29uc3Qgc3RyaXBwZWRVcmwgPSBzdHJpcEltYWdlU2l6ZXNGcm9tVXJsKHVybClcblxuICAgIC8vIGlmIHRoZSB1cmwgaGFkIG5vIGltYWdlIHNpemVzLCBkb24ndCBkbyBhbnl0aGluZyBzcGVjaWFsXG4gICAgaWYgKHN0cmlwcGVkVXJsID09PSB1cmwpIHtcbiAgICAgIHJldHVybiBhY2N1bXVsYXRvclxuICAgIH1cblxuICAgIGFjY3VtdWxhdG9yLnB1c2goc3RyaXBwZWRVcmwpXG5cbiAgICByZXR1cm4gYWNjdW11bGF0b3JcbiAgfSwgdXJscylcblxuY29uc3QgZmV0Y2hNZWRpYUl0ZW1zQnlTb3VyY2VVcmwgPSBhc3luYyAoe1xuICBtZWRpYUl0ZW1VcmxzLFxuICBzZWxlY3Rpb25TZXQsXG4gIGNyZWF0ZUNvbnRlbnREaWdlc3QsXG4gIGFjdGlvbnMsXG4gIGhlbHBlcnMsXG4gIGFsbE1lZGlhSXRlbU5vZGVzID0gW10sXG59KSA9PiB7XG4gIGNvbnN0IHBlclBhZ2UgPSAxMDBcbiAgY29uc3QgcHJvY2Vzc2VkTWVkaWFJdGVtVXJscyA9IHByb2Nlc3NJbWFnZVVybHMobWVkaWFJdGVtVXJscylcblxuICBjb25zdCB7XG4gICAgY2FjaGVkTWVkaWFJdGVtTm9kZUlkcyxcbiAgICB1bmNhY2hlZE1lZGlhSXRlbVVybHMsXG4gIH0gPSBwcm9jZXNzZWRNZWRpYUl0ZW1VcmxzLnJlZHVjZShcbiAgICAoYWNjdW11bGF0b3IsIHVybCkgPT4ge1xuICAgICAgY29uc3QgeyBpZCB9ID0gZ2V0RmlsZU5vZGVNZXRhQnlTb3VyY2VVcmwodXJsKSB8fCB7fVxuXG4gICAgICAvLyBpZiB3ZSBoYXZlIGEgY2FjaGVkIGltYWdlIGFuZCB3ZSBoYXZlbid0IGFscmVhZHkgcmVjb3JkZWQgdGhpcyBjYWNoZWQgaW1hZ2VcbiAgICAgIGlmIChpZCAmJiAhYWNjdW11bGF0b3IuY2FjaGVkTWVkaWFJdGVtTm9kZUlkcy5pbmNsdWRlcyhpZCkpIHtcbiAgICAgICAgLy8gc2F2ZSBpdFxuICAgICAgICBhY2N1bXVsYXRvci5jYWNoZWRNZWRpYUl0ZW1Ob2RlSWRzLnB1c2goaWQpXG4gICAgICB9IGVsc2UgaWYgKCFpZCkge1xuICAgICAgICAvLyBvdGhlcndpc2Ugd2UgbmVlZCB0byBmZXRjaCB0aGlzIG1lZGlhIGl0ZW0gYnkgdXJsXG4gICAgICAgIGFjY3VtdWxhdG9yLnVuY2FjaGVkTWVkaWFJdGVtVXJscy5wdXNoKHVybClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yXG4gICAgfSxcbiAgICB7IGNhY2hlZE1lZGlhSXRlbU5vZGVJZHM6IFtdLCB1bmNhY2hlZE1lZGlhSXRlbVVybHM6IFtdIH1cbiAgKVxuXG4gIC8vIHRha2Ugb3VyIHByZXZpb3VzbHkgY2FjaGVkIGlkJ3MgYW5kIGdldCBub2RlcyBmb3IgdGhlbVxuICBjb25zdCBwcmV2aW91c2x5Q2FjaGVkTWVkaWFJdGVtTm9kZXMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICBjYWNoZWRNZWRpYUl0ZW1Ob2RlSWRzLm1hcChhc3luYyAobm9kZUlkKSA9PiBoZWxwZXJzLmdldE5vZGUobm9kZUlkKSlcbiAgKVxuXG4gIC8vIGNodW5rIHVwIGFsbCBvdXIgdW5jYWNoZWQgbWVkaWEgaXRlbXNcbiAgY29uc3QgbWVkaWFJdGVtVXJsc1BhZ2VzID0gY2h1bmsodW5jYWNoZWRNZWRpYUl0ZW1VcmxzLCBwZXJQYWdlKVxuXG4gIC8vIHNpbmNlIHdlJ3JlIHVzaW5nIGFuIGFzeW5jIHF1ZXVlLCB3ZSBuZWVkIGEgd2F5IHRvIGtub3cgd2hlbiBpdCdzIGZpbmlzaGVkXG4gIC8vIHdlIHBhc3MgdGhpcyByZXNvbHZlIGZ1bmN0aW9uIGludG8gdGhlIHF1ZXVlIGZ1bmN0aW9uIHNvIGl0IGNhbiBsZXQgdXNcbiAgLy8ga25vdyB3aGVuIGl0J3MgZmluaXNoZWRcbiAgbGV0IHJlc29sdmVGdXR1cmVOb2Rlc1xuICBsZXQgZnV0dXJlTm9kZXMgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHJlc29sdmVGdXR1cmVOb2RlcyA9IChub2RlcyA9IFtdKSA9PlxuICAgICAgLy8gY29tYmluZSBvdXIgcmVzb2x2ZWQgbm9kZXMgd2UgZmV0Y2hlZCB3aXRoIG91ciBjYWNoZWQgbm9kZXNcbiAgICAgIHJlc29sdmUoWy4uLm5vZGVzLCAuLi5wcmV2aW91c2x5Q2FjaGVkTWVkaWFJdGVtTm9kZXNdKVxuICB9KVxuXG4gIC8vIHdlIGhhdmUgbm8gbWVkaWEgaXRlbXMgdG8gZmV0Y2gsXG4gIC8vIHNvIHdlIG5lZWQgdG8gcmVzb2x2ZSB0aGlzIHByb21pc2VcbiAgLy8gb3RoZXJ3aXNlIGl0IHdpbGwgbmV2ZXIgcmVzb2x2ZSBiZWxvdy5cbiAgaWYgKCFtZWRpYUl0ZW1VcmxzUGFnZXMubGVuZ3RoKSB7XG4gICAgcmVzb2x2ZUZ1dHVyZU5vZGVzKClcbiAgfVxuXG4gIC8vIGZvciBhbGwgdGhlIGltYWdlcyB3ZSBkb24ndCBoYXZlIGNhY2hlZCwgbG9vcCB0aHJvdWdoIGFuZCBnZXQgdGhlbSBhbGxcbiAgZm9yIChjb25zdCBbaW5kZXgsIHNvdXJjZVVybHNdIG9mIG1lZGlhSXRlbVVybHNQYWdlcy5lbnRyaWVzKCkpIHtcbiAgICBwdXNoUHJvbWlzZU9udG9SZXRyeVF1ZXVlKHtcbiAgICAgIGhlbHBlcnMsXG4gICAgICBjcmVhdGVDb250ZW50RGlnZXN0LFxuICAgICAgYWN0aW9ucyxcbiAgICAgIHF1ZXVlOiBtZWRpYU5vZGVGZXRjaFF1ZXVlLFxuICAgICAgcmV0cnlLZXk6IGBNZWRpYSBJdGVtIGJ5IHNvdXJjZVVybCBxdWVyeSAjJHtpbmRleH1gLFxuICAgICAgcmV0cnlQcm9taXNlOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gLyogR3JhcGhRTCAqLyBgXG4gICAgICAgICAgcXVlcnkgTUVESUFfSVRFTVMge1xuICAgICAgICAgICAgJHtzb3VyY2VVcmxzXG4gICAgICAgICAgICAgIC5tYXAoXG4gICAgICAgICAgICAgICAgKHNvdXJjZVVybCwgaW5kZXgpID0+IC8qIEdyYXBoUUwgKi8gYFxuICAgICAgICAgICAgICBtZWRpYUl0ZW1fX2luZGV4XyR7aW5kZXh9OiBtZWRpYUl0ZW0oaWQ6IFwiJHtzb3VyY2VVcmx9XCIsIGlkVHlwZTogU09VUkNFX1VSTCkge1xuICAgICAgICAgICAgICAgIC4uLk1lZGlhSXRlbUZyYWdtZW50XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAuam9pbihgIGApfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZyYWdtZW50IE1lZGlhSXRlbUZyYWdtZW50IG9uIE1lZGlhSXRlbSB7XG4gICAgICAgICAgICAke3NlbGVjdGlvblNldH1cbiAgICAgICAgICB9XG4gICAgICAgIGBcblxuICAgICAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGZldGNoR3JhcGhxbCh7XG4gICAgICAgICAgcXVlcnksXG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBmaXJzdDogcGVyUGFnZSxcbiAgICAgICAgICAgIGFmdGVyOiBudWxsLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3JDb250ZXh0OiBgRXJyb3Igb2NjdXJlZCB3aGlsZSBmZXRjaGluZyBcIk1lZGlhSXRlbVwiIG5vZGVzIGluIGlubGluZSBodG1sLmAsXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gc2luY2Ugd2UncmUgZ2V0dGluZyBlYWNoIG1lZGlhIGl0ZW0gb24gaXQncyBzaW5nbGUgbm9kZSByb290IGZpZWxkXG4gICAgICAgIC8vIHdlIGp1c3QgbmVlZHMgdGhlIHZhbHVlcyBvZiBlYWNoIHByb3BlcnR5IGluIHRoZSByZXNwb25zZVxuICAgICAgICAvLyBhbnl0aGluZyB0aGF0IHJldHVybnMgbnVsbCBpcyBiZWNhdXNlIHdlIHRyaWVkIHRvIGdldCB0aGUgc291cmNlIHVybFxuICAgICAgICAvLyBwbHVzIHRoZSBzb3VyY2UgdXJsIG1pbnVzIHJlc2l6ZSBwYXR0ZXJucy4gU28gdGhlcmUgd2lsbCBiZSBudWxsc1xuICAgICAgICAvLyBzaW5jZSBvbmx5IHRoZSBmdWxsIHNvdXJjZSB1cmwgd2lsbCByZXR1cm4gZGF0YVxuICAgICAgICBjb25zdCB0aGlzUGFnZXNOb2RlcyA9IE9iamVjdC52YWx1ZXMoZGF0YSkuZmlsdGVyKEJvb2xlYW4pXG5cbiAgICAgICAgLy8gdGFrZSB0aGUgV1BHcmFwaFFMIG5vZGVzIHdlIHJlY2VpdmVkIGFuZCBjcmVhdGUgR2F0c2J5IG5vZGVzIG91dCBvZiB0aGVtXG4gICAgICAgIGNvbnN0IG5vZGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgdGhpc1BhZ2VzTm9kZXMubWFwKChub2RlKSA9PlxuICAgICAgICAgICAgY3JlYXRlTWVkaWFJdGVtTm9kZSh7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIGhlbHBlcnMsXG4gICAgICAgICAgICAgIGNyZWF0ZUNvbnRlbnREaWdlc3QsXG4gICAgICAgICAgICAgIGFjdGlvbnMsXG4gICAgICAgICAgICAgIGFsbE1lZGlhSXRlbU5vZGVzLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICAgIClcblxuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlLCBpbmRleCkgPT4ge1xuICAgICAgICAgIC8vIHRoaXMgaXMgaG93IHdlJ3JlIGNhY2hpbmcgbm9kZXMgd2UndmUgcHJldmlvdXNseSBmZXRjaGVkLlxuICAgICAgICAgIHN0b3JlLmRpc3BhdGNoLmltYWdlTm9kZXMucHVzaE5vZGVNZXRhKHtcbiAgICAgICAgICAgIGlkOiBub2RlLmxvY2FsRmlsZS5pZCxcbiAgICAgICAgICAgIHNvdXJjZVVybDogc291cmNlVXJsc1tpbmRleF0sXG4gICAgICAgICAgICBtb2RpZmllZEdtdDogbm9kZS5tb2RpZmllZEdtdCxcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG4gICAgICAgIHJlc29sdmVGdXR1cmVOb2Rlcyhub2RlcylcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIGF3YWl0IG1lZGlhTm9kZUZldGNoUXVldWUub25JZGxlKClcbiAgYXdhaXQgbWVkaWFGaWxlRmV0Y2hRdWV1ZS5vbklkbGUoKVxuXG4gIHJldHVybiBmdXR1cmVOb2Rlc1xufVxuXG5jb25zdCBmZXRjaE1lZGlhSXRlbXNCeUlkID0gYXN5bmMgKHtcbiAgbWVkaWFJdGVtSWRzLFxuICBzZXR0aW5ncyxcbiAgdXJsLFxuICBzZWxlY3Rpb25TZXQsXG4gIGNyZWF0ZUNvbnRlbnREaWdlc3QsXG4gIGFjdGlvbnMsXG4gIGhlbHBlcnMsXG4gIHR5cGVJbmZvLFxufSkgPT4ge1xuICBpZiAoc2V0dGluZ3MubGltaXQgJiYgc2V0dGluZ3MubGltaXQgPCBtZWRpYUl0ZW1JZHMubGVuZ3RoKSB7XG4gICAgbWVkaWFJdGVtSWRzID0gbWVkaWFJdGVtSWRzLnNsaWNlKDAsIHNldHRpbmdzLmxpbWl0KVxuICB9XG5cbiAgY29uc3Qgbm9kZXNQZXJGZXRjaCA9IDEwMFxuICBjb25zdCBjaHVua2VkSWRzID0gY2h1bmsobWVkaWFJdGVtSWRzLCBub2Rlc1BlckZldGNoKVxuXG4gIGxldCByZXNvbHZlRnV0dXJlTm9kZXNcbiAgbGV0IGZ1dHVyZU5vZGVzID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICByZXNvbHZlRnV0dXJlTm9kZXMgPSByZXNvbHZlXG4gIH0pXG5cbiAgbGV0IGFsbE1lZGlhSXRlbU5vZGVzID0gW11cblxuICBmb3IgKGNvbnN0IFtpbmRleCwgcmVsYXlJZHNdIG9mIGNodW5rZWRJZHMuZW50cmllcygpKSB7XG4gICAgcHVzaFByb21pc2VPbnRvUmV0cnlRdWV1ZSh7XG4gICAgICBoZWxwZXJzLFxuICAgICAgY3JlYXRlQ29udGVudERpZ2VzdCxcbiAgICAgIGFjdGlvbnMsXG4gICAgICBxdWV1ZTogbWVkaWFOb2RlRmV0Y2hRdWV1ZSxcbiAgICAgIHJldHJ5S2V5OiBgTWVkaWEgSXRlbSBxdWVyeSAjJHtpbmRleH1gLFxuICAgICAgcmV0cnlQcm9taXNlOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIC8vIHJlbGF5IGlkJ3MgYXJlIGJhc2U2NCBlbmNvZGVkIGZyb20gc3RyaW5ncyBsaWtlIGF0dGFjaG1lbnQ6ODkzODFcbiAgICAgICAgLy8gd2hlcmUgODkzODEgaXMgdGhlIGlkIHdlIHdhbnQgZm9yIG91ciBxdWVyeVxuICAgICAgICAvLyBzbyB3ZSBzcGxpdCBvbiB0aGUgOiBhbmQgZ2V0IHRoZSBsYXN0IGl0ZW0gaW4gdGhlIGFycmF5LCB3aGljaCBpcyB0aGUgaWRcbiAgICAgICAgLy8gb25jZSB3ZSBjYW4gZ2V0IGEgbGlzdCBvZiBtZWRpYSBpdGVtcyBieSByZWxheSBpZCdzLCB3ZSBjYW4gcmVtb3ZlIGF0b2JcbiAgICAgICAgY29uc3QgaWRzID0gcmVsYXlJZHMubWFwKChpZCkgPT4gYXRvYihpZCkuc3BsaXQoYDpgKS5zbGljZSgtMSlbMF0pXG5cbiAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgcXVlcnkgTUVESUFfSVRFTVMoJGluOiBbSURdKSB7XG4gICAgICAgICAgICBtZWRpYUl0ZW1zKGZpcnN0OiAke25vZGVzUGVyRmV0Y2h9LCB3aGVyZTp7IGluOiAkaW4gfSkge1xuICAgICAgICAgICAgICBub2RlcyB7XG4gICAgICAgICAgICAgICAgJHtzZWxlY3Rpb25TZXR9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIGBcblxuICAgICAgICBjb25zdCBhbGxOb2Rlc09mQ29udGVudFR5cGUgPSBhd2FpdCBwYWdpbmF0ZWRXcE5vZGVGZXRjaCh7XG4gICAgICAgICAgZmlyc3Q6IG5vZGVzUGVyRmV0Y2gsXG4gICAgICAgICAgY29udGVudFR5cGVQbHVyYWw6IHR5cGVJbmZvLnBsdXJhbE5hbWUsXG4gICAgICAgICAgbm9kZVR5cGVOYW1lOiB0eXBlSW5mby5ub2Rlc1R5cGVOYW1lLFxuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIHVybCxcbiAgICAgICAgICBoZWxwZXJzLFxuICAgICAgICAgIHNldHRpbmdzLFxuICAgICAgICAgIGluOiBpZHMsXG4gICAgICAgICAgLy8gdGhpcyBhbGxvd3MgdXMgdG8gcmV0cnktb24tZW5kLW9mLXF1ZXVlXG4gICAgICAgICAgdGhyb3dGZXRjaEVycm9yczogdHJ1ZSxcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBub2RlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgIGFsbE5vZGVzT2ZDb250ZW50VHlwZS5tYXAoKG5vZGUpID0+XG4gICAgICAgICAgICBjcmVhdGVNZWRpYUl0ZW1Ob2RlKHtcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgaGVscGVycyxcbiAgICAgICAgICAgICAgY3JlYXRlQ29udGVudERpZ2VzdCxcbiAgICAgICAgICAgICAgYWN0aW9ucyxcbiAgICAgICAgICAgICAgYWxsTWVkaWFJdGVtTm9kZXMsXG4gICAgICAgICAgICAgIHJlZmVyZW5jZWRNZWRpYUl0ZW1Ob2RlSWRzOiBtZWRpYUl0ZW1JZHMsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgKVxuXG4gICAgICAgIHJlc29sdmVGdXR1cmVOb2Rlcyhub2RlcylcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIGF3YWl0IG1lZGlhTm9kZUZldGNoUXVldWUub25JZGxlKClcbiAgYXdhaXQgbWVkaWFGaWxlRmV0Y2hRdWV1ZS5vbklkbGUoKVxuXG4gIHJldHVybiBmdXR1cmVOb2Rlc1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBmZXRjaFJlZmVyZW5jZWRNZWRpYUl0ZW1zQW5kQ3JlYXRlTm9kZXMoe1xuICByZWZlcmVuY2VkTWVkaWFJdGVtTm9kZUlkcyxcbiAgbWVkaWFJdGVtVXJscyxcbn0pIHtcbiAgY29uc3Qgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpXG4gIGNvbnN0IHF1ZXJ5SW5mbyA9IHN0YXRlLnJlbW90ZVNjaGVtYS5ub2RlUXVlcmllcy5tZWRpYUl0ZW1zXG5cbiAgY29uc3QgeyBoZWxwZXJzLCBwbHVnaW5PcHRpb25zIH0gPSBzdGF0ZS5nYXRzYnlBcGlcbiAgY29uc3QgeyBjcmVhdGVDb250ZW50RGlnZXN0LCBhY3Rpb25zIH0gPSBoZWxwZXJzXG4gIGNvbnN0IHsgdXJsLCB2ZXJib3NlIH0gPSBwbHVnaW5PcHRpb25zXG4gIGNvbnN0IHsgdHlwZUluZm8sIHNldHRpbmdzLCBzZWxlY3Rpb25TZXQgfSA9IHF1ZXJ5SW5mb1xuXG4gIGxldCBjcmVhdGVkTm9kZXMgPSBbXVxuXG4gIGlmIChyZWZlcmVuY2VkTWVkaWFJdGVtTm9kZUlkcz8ubGVuZ3RoKSB7XG4gICAgY29uc3Qgbm9kZXNTb3VyY2VkQnlJZCA9IGF3YWl0IGZldGNoTWVkaWFJdGVtc0J5SWQoe1xuICAgICAgbWVkaWFJdGVtSWRzOiByZWZlcmVuY2VkTWVkaWFJdGVtTm9kZUlkcyxcbiAgICAgIHNldHRpbmdzLFxuICAgICAgdXJsLFxuICAgICAgc2VsZWN0aW9uU2V0LFxuICAgICAgY3JlYXRlQ29udGVudERpZ2VzdCxcbiAgICAgIGFjdGlvbnMsXG4gICAgICBoZWxwZXJzLFxuICAgICAgdHlwZUluZm8sXG4gICAgfSlcblxuICAgIGNyZWF0ZWROb2RlcyA9IG5vZGVzU291cmNlZEJ5SWRcbiAgfVxuXG4gIGlmIChtZWRpYUl0ZW1VcmxzPy5sZW5ndGgpIHtcbiAgICBjb25zdCBub2Rlc1NvdXJjZWRCeVVybCA9IGF3YWl0IGZldGNoTWVkaWFJdGVtc0J5U291cmNlVXJsKHtcbiAgICAgIG1lZGlhSXRlbVVybHMsXG4gICAgICBzZXR0aW5ncyxcbiAgICAgIHVybCxcbiAgICAgIHNlbGVjdGlvblNldCxcbiAgICAgIGNyZWF0ZUNvbnRlbnREaWdlc3QsXG4gICAgICBhY3Rpb25zLFxuICAgICAgaGVscGVycyxcbiAgICAgIHR5cGVJbmZvLFxuICAgIH0pXG5cbiAgICBjcmVhdGVkTm9kZXMgPSBbLi4uY3JlYXRlZE5vZGVzLCAuLi5ub2Rlc1NvdXJjZWRCeVVybF1cbiAgfVxuXG4gIHJldHVybiBjcmVhdGVkTm9kZXNcbn1cbiJdfQ==