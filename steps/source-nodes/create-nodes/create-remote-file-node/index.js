"use strict";

require("source-map-support/register");

const fs = require(`fs-extra`);

const got = require(`got`);

const {
  createContentDigest
} = require(`gatsby-core-utils`);

const path = require(`path`);

const {
  isWebUri
} = require(`valid-url`);

const Queue = require(`better-queue`);

const readChunk = require(`read-chunk`);

const fileType = require(`file-type`);

const {
  createProgress
} = require(`gatsby-source-filesystem/utils`);

const {
  createFileNode
} = require(`gatsby-source-filesystem/create-file-node`);

const {
  getRemoteFileExtension,
  getRemoteFileName,
  createFilePath
} = require(`gatsby-source-filesystem/utils`);

const cacheId = url => `create-remote-file-node-${url}`;

let bar; // Keep track of the total number of jobs we push in the queue

let totalJobs = 0;
/********************
 * Type Definitions *
 ********************/

/**
 * @typedef {GatsbyCache}
 * @see gatsby/packages/gatsby/utils/cache.js
 */

/**
 * @typedef {Reporter}
 * @see gatsby/packages/gatsby-cli/lib/reporter.js
 */

/**
 * @typedef {Auth}
 * @type {Object}
 * @property {String} htaccess_pass
 * @property {String} htaccess_user
 */

/**
 * @typedef {CreateRemoteFileNodePayload}
 * @typedef {Object}
 * @description Create Remote File Node Payload
 *
 * @param  {String} options.url
 * @param  {GatsbyCache} options.cache
 * @param  {Function} options.createNode
 * @param  {Function} options.getCache
 * @param  {Auth} [options.auth]
 * @param  {Reporter} [options.reporter]
 */

const STALL_RETRY_LIMIT = 3;
const STALL_TIMEOUT = 30000;
const CONNECTION_RETRY_LIMIT = 5;
const CONNECTION_TIMEOUT = 30000;
/********************
 * Queue Management *
 ********************/

/**
 * Queue
 * Use the task's url as the id
 * When pushing a task with a similar id, prefer the original task
 * as it's already in the processing cache
 */

const queue = new Queue(pushToQueue, {
  id: `url`,
  merge: (old, _, cb) => cb(old),
  concurrent: process.env.GATSBY_CONCURRENT_DOWNLOAD || 200
});
let doneQueueTimeout; // when the queue is empty we stop the progressbar

queue.on(`drain`, () => {
  if (bar) {
    // this is to give us a little time to wait and see if there
    // will be more jobs added with a break between
    // sometimes the queue empties but then is recreated within 2 secs
    doneQueueTimeout = setTimeout(() => {
      bar.done();
      totalJobs = 0;
    }, 2000);
  }
});
/**
 * @callback {Queue~queueCallback}
 * @param {*} error
 * @param {*} result
 */

/**
 * pushToQueue
 * --
 * Handle tasks that are pushed in to the Queue
 *
 *
 * @param  {CreateRemoteFileNodePayload}          task
 * @param  {Queue~queueCallback}  cb
 * @return {Promise<null>}
 */

async function pushToQueue(task, cb) {
  try {
    const node = await processRemoteNode(task);
    return cb(null, node);
  } catch (e) {
    return cb(e);
  }
}
/******************
 * Core Functions *
 ******************/

/**
 * requestRemoteNode
 * --
 * Download the requested file
 *
 * @param  {String}   url
 * @param  {Headers}  headers
 * @param  {String}   tmpFilename
 * @param  {Object}   httpOpts
 * @param  {number}   attempt
 * @return {Promise<Object>}  Resolves with the [http Result Object]{@link https://nodejs.org/api/http.html#http_class_http_serverresponse}
 */


const requestRemoteNode = (url, headers, tmpFilename, httpOpts, attempt = 1, fixedBarTotal) => new Promise((resolve, reject) => {
  let timeout; // Called if we stall for 30s without receiving any data

  const handleTimeout = async () => {
    fsWriteStream.close();
    fs.removeSync(tmpFilename);

    if (attempt < STALL_RETRY_LIMIT) {
      // Retry by calling ourself recursively
      resolve(requestRemoteNode(url, headers, tmpFilename, httpOpts, attempt + 1));
    } else {
      processingCache[url] = null;
      totalJobs -= 1;

      if (!fixedBarTotal) {
        bar.total = totalJobs;
      }

      reject(`Failed to download ${url} after ${STALL_RETRY_LIMIT} attempts`);
    }
  };

  const resetTimeout = () => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(handleTimeout, STALL_TIMEOUT);
  };

  const responseStream = got.stream(url, Object.assign({
    headers,
    timeout: CONNECTION_TIMEOUT,
    retries: CONNECTION_RETRY_LIMIT
  }, httpOpts));
  const fsWriteStream = fs.createWriteStream(tmpFilename);
  responseStream.pipe(fsWriteStream); // If there's a 400/500 response or other error.

  responseStream.on(`error`, error => {
    if (timeout) {
      clearTimeout(timeout);
    }

    processingCache[url] = null;
    totalJobs -= 1;

    if (!fixedBarTotal) {
      bar.total = totalJobs;
    }

    fs.removeSync(tmpFilename);
    reject(error);
  });
  fsWriteStream.on(`error`, error => {
    if (timeout) {
      clearTimeout(timeout);
    }

    processingCache[url] = null;
    totalJobs -= 1;

    if (!fixedBarTotal) {
      bar.total = totalJobs;
    }

    reject(error);
  });
  responseStream.on(`response`, response => {
    resetTimeout();
    fsWriteStream.on(`finish`, () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolve(response);
    });
  });
});
/**
 * processRemoteNode
 * --
 * Request the remote file and return the fileNode
 *
 * @param {CreateRemoteFileNodePayload} options
 * @return {Promise<Object>} Resolves with the fileNode
 */


async function processRemoteNode({
  url,
  cache,
  createNode,
  parentNodeId,
  auth = {},
  httpHeaders = {},
  createNodeId,
  ext,
  name,
  fixedBarTotal
}) {
  const pluginCacheDir = cache.directory; // See if there's response headers for this url
  // from a previous request.

  const cachedHeaders = await cache.get(cacheId(url));
  const headers = Object.assign({}, httpHeaders);

  if (cachedHeaders && cachedHeaders.etag) {
    headers[`If-None-Match`] = cachedHeaders.etag;
  } // Add htaccess authentication if passed in. This isn't particularly
  // extensible. We should define a proper API that we validate.


  const httpOpts = {};

  if (auth && (auth.htaccess_pass || auth.htaccess_user)) {
    httpOpts.auth = `${auth.htaccess_user}:${auth.htaccess_pass}`;
  } // Create the temp and permanent file names for the url.


  const digest = createContentDigest(url);

  if (!name) {
    name = getRemoteFileName(url);
  }

  if (!ext) {
    ext = getRemoteFileExtension(url);
  }

  const tmpFilename = createFilePath(pluginCacheDir, `tmp-${digest}`, ext); // Fetch the file.

  const response = await requestRemoteNode(url, headers, tmpFilename, httpOpts, fixedBarTotal);

  if (response.statusCode == 200) {
    // Save the response headers for future requests.
    await cache.set(cacheId(url), response.headers);
  } // If the user did not provide an extension and we couldn't get one from remote file, try and guess one


  if (ext === ``) {
    const buffer = readChunk.sync(tmpFilename, 0, fileType.minimumBytes);
    const filetype = fileType(buffer);

    if (filetype) {
      ext = `.${filetype.ext}`;
    }
  }

  const filename = createFilePath(path.join(pluginCacheDir, digest), name, ext); // If the status code is 200, move the piped temp file to the real name.

  if (response.statusCode === 200) {
    await fs.move(tmpFilename, filename, {
      overwrite: true
    }); // Else if 304, remove the empty response.
  } else {
    processingCache[url] = null;
    totalJobs -= 1;

    if (!fixedBarTotal) {
      bar.total = totalJobs;
    }

    await fs.remove(tmpFilename);
  } // Create the file node.


  const fileNode = await createFileNode(filename, createNodeId, {});
  fileNode.internal.description = `File "${url}"`;
  fileNode.url = url;
  fileNode.parent = parentNodeId; // Override the default plugin as gatsby-source-filesystem needs to
  // be the owner of File nodes or there'll be conflicts if any other
  // File nodes are created through normal usages of
  // gatsby-source-filesystem.

  await createNode(fileNode, {
    name: `gatsby-source-filesystem`
  });
  return fileNode;
}
/**
 * Index of promises resolving to File node from remote url
 */


const processingCache = {};
/**
 * pushTask
 * --
 * pushes a task in to the Queue and the processing cache
 *
 * Promisfy a task in queue
 * @param {CreateRemoteFileNodePayload} task
 * @return {Promise<Object>}
 */

const pushTask = task => new Promise((resolve, reject) => {
  queue.push(task).on(`finish`, task => {
    resolve(task);
  }).on(`failed`, err => {
    reject(`failed to process ${task.url}\n${err}`);
  });
});
/***************
 * Entry Point *
 ***************/

/**
 * createRemoteFileNode
 * --
 *
 * Download a remote file
 * First checks cache to ensure duplicate requests aren't processed
 * Then pushes to a queue
 *
 * @param {CreateRemoteFileNodePayload} options
 * @return {Promise<Object>}                  Returns the created node
 */


module.exports = ({
  url,
  cache,
  createNode,
  getCache,
  fixedBarTotal,
  parentNodeId = null,
  auth = {},
  httpHeaders = {},
  createNodeId,
  ext = null,
  name = null,
  reporter
}) => {
  if (doneQueueTimeout) {
    // this is to give the bar a little time to wait when there are pauses
    // between file downloads.
    clearTimeout(doneQueueTimeout);
  } // this accounts for special characters in filenames


  url = encodeURI(url); // validation of the input
  // without this it's notoriously easy to pass in the wrong `createNodeId`
  // see gatsbyjs/gatsby#6643

  if (typeof createNodeId !== `function`) {
    throw new Error(`createNodeId must be a function, was ${typeof createNodeId}`);
  }

  if (typeof createNode !== `function`) {
    throw new Error(`createNode must be a function, was ${typeof createNode}`);
  }

  if (typeof getCache === `function`) {
    // use cache of this plugin and not cache of function caller
    cache = getCache(`gatsby-source-filesystem`);
  }

  if (typeof cache !== `object`) {
    throw new Error(`Neither "cache" or "getCache" was passed. getCache must be function that return Gatsby cache, "cache" must be the Gatsby cache, was ${typeof cache}`);
  } // Check if we already requested node for this remote file
  // and return stored promise if we did.


  if (processingCache[url]) {
    return processingCache[url];
  }

  if (!url || isWebUri(url) === undefined) {
    return Promise.reject(`wrong url: ${url}`);
  }

  if (totalJobs === 0) {
    bar = createProgress(`Downloading remote files`, reporter);
    bar.start();
  }

  totalJobs += 1;

  if (fixedBarTotal) {
    bar.total = fixedBarTotal;
  } else {
    bar.total = totalJobs;
  }

  const fileDownloadPromise = pushTask({
    url,
    cache,
    createNode,
    parentNodeId,
    createNodeId,
    auth,
    httpHeaders,
    ext,
    name,
    fixedBarTotal
  });
  processingCache[url] = fileDownloadPromise.then(node => {
    bar.tick();
    return node;
  });
  return processingCache[url];
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvY3JlYXRlLW5vZGVzL2NyZWF0ZS1yZW1vdGUtZmlsZS1ub2RlL2luZGV4LmpzIl0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsImdvdCIsImNyZWF0ZUNvbnRlbnREaWdlc3QiLCJwYXRoIiwiaXNXZWJVcmkiLCJRdWV1ZSIsInJlYWRDaHVuayIsImZpbGVUeXBlIiwiY3JlYXRlUHJvZ3Jlc3MiLCJjcmVhdGVGaWxlTm9kZSIsImdldFJlbW90ZUZpbGVFeHRlbnNpb24iLCJnZXRSZW1vdGVGaWxlTmFtZSIsImNyZWF0ZUZpbGVQYXRoIiwiY2FjaGVJZCIsInVybCIsImJhciIsInRvdGFsSm9icyIsIlNUQUxMX1JFVFJZX0xJTUlUIiwiU1RBTExfVElNRU9VVCIsIkNPTk5FQ1RJT05fUkVUUllfTElNSVQiLCJDT05ORUNUSU9OX1RJTUVPVVQiLCJxdWV1ZSIsInB1c2hUb1F1ZXVlIiwiaWQiLCJtZXJnZSIsIm9sZCIsIl8iLCJjYiIsImNvbmN1cnJlbnQiLCJwcm9jZXNzIiwiZW52IiwiR0FUU0JZX0NPTkNVUlJFTlRfRE9XTkxPQUQiLCJkb25lUXVldWVUaW1lb3V0Iiwib24iLCJzZXRUaW1lb3V0IiwiZG9uZSIsInRhc2siLCJub2RlIiwicHJvY2Vzc1JlbW90ZU5vZGUiLCJlIiwicmVxdWVzdFJlbW90ZU5vZGUiLCJoZWFkZXJzIiwidG1wRmlsZW5hbWUiLCJodHRwT3B0cyIsImF0dGVtcHQiLCJmaXhlZEJhclRvdGFsIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0aW1lb3V0IiwiaGFuZGxlVGltZW91dCIsImZzV3JpdGVTdHJlYW0iLCJjbG9zZSIsInJlbW92ZVN5bmMiLCJwcm9jZXNzaW5nQ2FjaGUiLCJ0b3RhbCIsInJlc2V0VGltZW91dCIsImNsZWFyVGltZW91dCIsInJlc3BvbnNlU3RyZWFtIiwic3RyZWFtIiwicmV0cmllcyIsImNyZWF0ZVdyaXRlU3RyZWFtIiwicGlwZSIsImVycm9yIiwicmVzcG9uc2UiLCJjYWNoZSIsImNyZWF0ZU5vZGUiLCJwYXJlbnROb2RlSWQiLCJhdXRoIiwiaHR0cEhlYWRlcnMiLCJjcmVhdGVOb2RlSWQiLCJleHQiLCJuYW1lIiwicGx1Z2luQ2FjaGVEaXIiLCJkaXJlY3RvcnkiLCJjYWNoZWRIZWFkZXJzIiwiZ2V0IiwiZXRhZyIsImh0YWNjZXNzX3Bhc3MiLCJodGFjY2Vzc191c2VyIiwiZGlnZXN0Iiwic3RhdHVzQ29kZSIsInNldCIsImJ1ZmZlciIsInN5bmMiLCJtaW5pbXVtQnl0ZXMiLCJmaWxldHlwZSIsImZpbGVuYW1lIiwiam9pbiIsIm1vdmUiLCJvdmVyd3JpdGUiLCJyZW1vdmUiLCJmaWxlTm9kZSIsImludGVybmFsIiwiZGVzY3JpcHRpb24iLCJwYXJlbnQiLCJwdXNoVGFzayIsInB1c2giLCJlcnIiLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2V0Q2FjaGUiLCJyZXBvcnRlciIsImVuY29kZVVSSSIsIkVycm9yIiwidW5kZWZpbmVkIiwic3RhcnQiLCJmaWxlRG93bmxvYWRQcm9taXNlIiwidGhlbiIsInRpY2siXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBRSxVQUFGLENBQWxCOztBQUNBLE1BQU1DLEdBQUcsR0FBR0QsT0FBTyxDQUFFLEtBQUYsQ0FBbkI7O0FBQ0EsTUFBTTtBQUFFRSxFQUFBQTtBQUFGLElBQTBCRixPQUFPLENBQUUsbUJBQUYsQ0FBdkM7O0FBQ0EsTUFBTUcsSUFBSSxHQUFHSCxPQUFPLENBQUUsTUFBRixDQUFwQjs7QUFDQSxNQUFNO0FBQUVJLEVBQUFBO0FBQUYsSUFBZUosT0FBTyxDQUFFLFdBQUYsQ0FBNUI7O0FBQ0EsTUFBTUssS0FBSyxHQUFHTCxPQUFPLENBQUUsY0FBRixDQUFyQjs7QUFDQSxNQUFNTSxTQUFTLEdBQUdOLE9BQU8sQ0FBRSxZQUFGLENBQXpCOztBQUNBLE1BQU1PLFFBQVEsR0FBR1AsT0FBTyxDQUFFLFdBQUYsQ0FBeEI7O0FBQ0EsTUFB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USxDQUFDVSxHQUFELENBQVIsS0FBa0IyRixTQUE5QixFQUF5QztBQUN2QyxXQUFPM0QsT0FBTyxDQUFDRSxNQUFSLENBQWdCLGNBQWFsQyxHQUFJLEVBQWpDLENBQVA7QUFDRDs7QUFFRCxNQUFJRSxTQUFTLEtBQUssQ0FBbEIsRUFBcUI7QUFDbkJELElBQUFBLEdBQUcsR0FBR1AsY0FBYyxDQUFFLDBCQUFGLEVBQTZCOEYsUUFBN0IsQ0FBcEI7QUFDQXZGLElBQUFBLEdBQUcsQ0FBQzJGLEtBQUo7QUFDRDs7QUFFRDFGLEVBQUFBLFNBQVMsSUFBSSxDQUFiOztBQUVBLE1BQUk2QixhQUFKLEVBQW1CO0FBQ2pCOUIsSUFBQUEsR0FBRyxDQUFDd0MsS0FBSixHQUFZVixhQUFaO0FBQ0QsR0FGRCxNQUVPO0FBQ0w5QixJQUFBQSxHQUFHLENBQUN3QyxLQUFKLEdBQVl2QyxTQUFaO0FBQ0Q7O0FBRUQsUUFBTTJGLG1CQUFtQixHQUFHWCxRQUFRLENBQUM7QUFDbkNsRixJQUFBQSxHQURtQztBQUVuQ21ELElBQUFBLEtBRm1DO0FBR25DQyxJQUFBQSxVQUhtQztBQUluQ0MsSUFBQUEsWUFKbUM7QUFLbkNHLElBQUFBLFlBTG1DO0FBTW5DRixJQUFBQSxJQU5tQztBQU9uQ0MsSUFBQUEsV0FQbUM7QUFRbkNFLElBQUFBLEdBUm1DO0FBU25DQyxJQUFBQSxJQVRtQztBQVVuQzNCLElBQUFBO0FBVm1DLEdBQUQsQ0FBcEM7QUFhQVMsRUFBQUEsZUFBZSxDQUFDeEMsR0FBRCxDQUFmLEdBQXVCNkYsbUJBQW1CLENBQUNDLElBQXBCLENBQTBCdkUsSUFBRCxJQUFVO0FBQ3hEdEIsSUFBQUEsR0FBRyxDQUFDOEYsSUFBSjtBQUVBLFdBQU94RSxJQUFQO0FBQ0QsR0FKc0IsQ0FBdkI7QUFNQSxTQUFPaUIsZUFBZSxDQUFDeEMsR0FBRCxDQUF0QjtBQUNELENBdkZEIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZnMgPSByZXF1aXJlKGBmcy1leHRyYWApXG5jb25zdCBnb3QgPSByZXF1aXJlKGBnb3RgKVxuY29uc3QgeyBjcmVhdGVDb250ZW50RGlnZXN0IH0gPSByZXF1aXJlKGBnYXRzYnktY29yZS11dGlsc2ApXG5jb25zdCBwYXRoID0gcmVxdWlyZShgcGF0aGApXG5jb25zdCB7IGlzV2ViVXJpIH0gPSByZXF1aXJlKGB2YWxpZC11cmxgKVxuY29uc3QgUXVldWUgPSByZXF1aXJlKGBiZXR0ZXItcXVldWVgKVxuY29uc3QgcmVhZENodW5rID0gcmVxdWlyZShgcmVhZC1jaHVua2ApXG5jb25zdCBmaWxlVHlwZSA9IHJlcXVpcmUoYGZpbGUtdHlwZWApXG5jb25zdCB7IGNyZWF0ZVByb2dyZXNzIH0gPSByZXF1aXJlKGBnYXRzYnktc291cmNlLWZpbGVzeXN0ZW0vdXRpbHNgKVxuXG5jb25zdCB7IGNyZWF0ZUZpbGVOb2RlIH0gPSByZXF1aXJlKGBnYXRzYnktc291cmNlLWZpbGVzeXN0ZW0vY3JlYXRlLWZpbGUtbm9kZWApXG5jb25zdCB7XG4gIGdldFJlbW90ZUZpbGVFeHRlbnNpb24sXG4gIGdldFJlbW90ZUZpbGVOYW1lLFxuICBjcmVhdGVGaWxlUGF0aCxcbn0gPSByZXF1aXJlKGBnYXRzYnktc291cmNlLWZpbGVzeXN0ZW0vdXRpbHNgKVxuY29uc3QgY2FjaGVJZCA9ICh1cmwpID0+IGBjcmVhdGUtcmVtb3RlLWZpbGUtbm9kZS0ke3VybH1gXG5cbmxldCBiYXJcbi8vIEtlZXAgdHJhY2sgb2YgdGhlIHRvdGFsIG51bWJlciBvZiBqb2JzIHdlIHB1c2ggaW4gdGhlIHF1ZXVlXG5sZXQgdG90YWxKb2JzID0gMFxuXG4vKioqKioqKioqKioqKioqKioqKipcbiAqIFR5cGUgRGVmaW5pdGlvbnMgKlxuICoqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtHYXRzYnlDYWNoZX1cbiAqIEBzZWUgZ2F0c2J5L3BhY2thZ2VzL2dhdHNieS91dGlscy9jYWNoZS5qc1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge1JlcG9ydGVyfVxuICogQHNlZSBnYXRzYnkvcGFja2FnZXMvZ2F0c2J5LWNsaS9saWIvcmVwb3J0ZXIuanNcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtBdXRofVxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBodGFjY2Vzc19wYXNzXG4gKiBAcHJvcGVydHkge1N0cmluZ30gaHRhY2Nlc3NfdXNlclxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge0NyZWF0ZVJlbW90ZUZpbGVOb2RlUGF5bG9hZH1cbiAqIEB0eXBlZGVmIHtPYmplY3R9XG4gKiBAZGVzY3JpcHRpb24gQ3JlYXRlIFJlbW90ZSBGaWxlIE5vZGUgUGF5bG9hZFxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gb3B0aW9ucy51cmxcbiAqIEBwYXJhbSAge0dhdHNieUNhY2hlfSBvcHRpb25zLmNhY2hlXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gb3B0aW9ucy5jcmVhdGVOb2RlXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gb3B0aW9ucy5nZXRDYWNoZVxuICogQHBhcmFtICB7QXV0aH0gW29wdGlvbnMuYXV0aF1cbiAqIEBwYXJhbSAge1JlcG9ydGVyfSBbb3B0aW9ucy5yZXBvcnRlcl1cbiAqL1xuXG5jb25zdCBTVEFMTF9SRVRSWV9MSU1JVCA9IDNcbmNvbnN0IFNUQUxMX1RJTUVPVVQgPSAzMDAwMFxuXG5jb25zdCBDT05ORUNUSU9OX1JFVFJZX0xJTUlUID0gNVxuY29uc3QgQ09OTkVDVElPTl9USU1FT1VUID0gMzAwMDBcblxuLyoqKioqKioqKioqKioqKioqKioqXG4gKiBRdWV1ZSBNYW5hZ2VtZW50ICpcbiAqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBRdWV1ZVxuICogVXNlIHRoZSB0YXNrJ3MgdXJsIGFzIHRoZSBpZFxuICogV2hlbiBwdXNoaW5nIGEgdGFzayB3aXRoIGEgc2ltaWxhciBpZCwgcHJlZmVyIHRoZSBvcmlnaW5hbCB0YXNrXG4gKiBhcyBpdCdzIGFscmVhZHkgaW4gdGhlIHByb2Nlc3NpbmcgY2FjaGVcbiAqL1xuY29uc3QgcXVldWUgPSBuZXcgUXVldWUocHVzaFRvUXVldWUsIHtcbiAgaWQ6IGB1cmxgLFxuICBtZXJnZTogKG9sZCwgXywgY2IpID0+IGNiKG9sZCksXG4gIGNvbmN1cnJlbnQ6IHByb2Nlc3MuZW52LkdBVFNCWV9DT05DVVJSRU5UX0RPV05MT0FEIHx8IDIwMCxcbn0pXG5cbmxldCBkb25lUXVldWVUaW1lb3V0XG5cbi8vIHdoZW4gdGhlIHF1ZXVlIGlzIGVtcHR5IHdlIHN0b3AgdGhlIHByb2dyZXNzYmFyXG5xdWV1ZS5vbihgZHJhaW5gLCAoKSA9PiB7XG4gIGlmIChiYXIpIHtcbiAgICAvLyB0aGlzIGlzIHRvIGdpdmUgdXMgYSBsaXR0bGUgdGltZSB0byB3YWl0IGFuZCBzZWUgaWYgdGhlcmVcbiAgICAvLyB3aWxsIGJlIG1vcmUgam9icyBhZGRlZCB3aXRoIGEgYnJlYWsgYmV0d2VlblxuICAgIC8vIHNvbWV0aW1lcyB0aGUgcXVldWUgZW1wdGllcyBidXQgdGhlbiBpcyByZWNyZWF0ZWQgd2l0aGluIDIgc2Vjc1xuICAgIGRvbmVRdWV1ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGJhci5kb25lKClcbiAgICAgIHRvdGFsSm9icyA9IDBcbiAgICB9LCAyMDAwKVxuICB9XG59KVxuXG4vKipcbiAqIEBjYWxsYmFjayB7UXVldWV+cXVldWVDYWxsYmFja31cbiAqIEBwYXJhbSB7Kn0gZXJyb3JcbiAqIEBwYXJhbSB7Kn0gcmVzdWx0XG4gKi9cblxuLyoqXG4gKiBwdXNoVG9RdWV1ZVxuICogLS1cbiAqIEhhbmRsZSB0YXNrcyB0aGF0IGFyZSBwdXNoZWQgaW4gdG8gdGhlIFF1ZXVlXG4gKlxuICpcbiAqIEBwYXJhbSAge0NyZWF0ZVJlbW90ZUZpbGVOb2RlUGF5bG9hZH0gICAgICAgICAgdGFza1xuICogQHBhcmFtICB7UXVldWV+cXVldWVDYWxsYmFja30gIGNiXG4gKiBAcmV0dXJuIHtQcm9taXNlPG51bGw+fVxuICovXG5hc3luYyBmdW5jdGlvbiBwdXNoVG9RdWV1ZSh0YXNrLCBjYikge1xuICB0cnkge1xuICAgIGNvbnN0IG5vZGUgPSBhd2FpdCBwcm9jZXNzUmVtb3RlTm9kZSh0YXNrKVxuICAgIHJldHVybiBjYihudWxsLCBub2RlKVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGNiKGUpXG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKlxuICogQ29yZSBGdW5jdGlvbnMgKlxuICoqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiByZXF1ZXN0UmVtb3RlTm9kZVxuICogLS1cbiAqIERvd25sb2FkIHRoZSByZXF1ZXN0ZWQgZmlsZVxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gICB1cmxcbiAqIEBwYXJhbSAge0hlYWRlcnN9ICBoZWFkZXJzXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgdG1wRmlsZW5hbWVcbiAqIEBwYXJhbSAge09iamVjdH0gICBodHRwT3B0c1xuICogQHBhcmFtICB7bnVtYmVyfSAgIGF0dGVtcHRcbiAqIEByZXR1cm4ge1Byb21pc2U8T2JqZWN0Pn0gIFJlc29sdmVzIHdpdGggdGhlIFtodHRwIFJlc3VsdCBPYmplY3Rde0BsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvaHR0cC5odG1sI2h0dHBfY2xhc3NfaHR0cF9zZXJ2ZXJyZXNwb25zZX1cbiAqL1xuY29uc3QgcmVxdWVzdFJlbW90ZU5vZGUgPSAoXG4gIHVybCxcbiAgaGVhZGVycyxcbiAgdG1wRmlsZW5hbWUsXG4gIGh0dHBPcHRzLFxuICBhdHRlbXB0ID0gMSxcbiAgZml4ZWRCYXJUb3RhbFxuKSA9PlxuICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHRpbWVvdXRcblxuICAgIC8vIENhbGxlZCBpZiB3ZSBzdGFsbCBmb3IgMzBzIHdpdGhvdXQgcmVjZWl2aW5nIGFueSBkYXRhXG4gICAgY29uc3QgaGFuZGxlVGltZW91dCA9IGFzeW5jICgpID0+IHtcbiAgICAgIGZzV3JpdGVTdHJlYW0uY2xvc2UoKVxuICAgICAgZnMucmVtb3ZlU3luYyh0bXBGaWxlbmFtZSlcbiAgICAgIGlmIChhdHRlbXB0IDwgU1RBTExfUkVUUllfTElNSVQpIHtcbiAgICAgICAgLy8gUmV0cnkgYnkgY2FsbGluZyBvdXJzZWxmIHJlY3Vyc2l2ZWx5XG4gICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgcmVxdWVzdFJlbW90ZU5vZGUodXJsLCBoZWFkZXJzLCB0bXBGaWxlbmFtZSwgaHR0cE9wdHMsIGF0dGVtcHQgKyAxKVxuICAgICAgICApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9jZXNzaW5nQ2FjaGVbdXJsXSA9IG51bGxcbiAgICAgICAgdG90YWxKb2JzIC09IDFcbiAgICAgICAgaWYgKCFmaXhlZEJhclRvdGFsKSB7XG4gICAgICAgICAgYmFyLnRvdGFsID0gdG90YWxKb2JzXG4gICAgICAgIH1cbiAgICAgICAgcmVqZWN0KGBGYWlsZWQgdG8gZG93bmxvYWQgJHt1cmx9IGFmdGVyICR7U1RBTExfUkVUUllfTElNSVR9IGF0dGVtcHRzYClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXNldFRpbWVvdXQgPSAoKSA9PiB7XG4gICAgICBpZiAodGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICAgIH1cbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGhhbmRsZVRpbWVvdXQsIFNUQUxMX1RJTUVPVVQpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlU3RyZWFtID0gZ290LnN0cmVhbSh1cmwsIHtcbiAgICAgIGhlYWRlcnMsXG4gICAgICB0aW1lb3V0OiBDT05ORUNUSU9OX1RJTUVPVVQsXG4gICAgICByZXRyaWVzOiBDT05ORUNUSU9OX1JFVFJZX0xJTUlULFxuICAgICAgLi4uaHR0cE9wdHMsXG4gICAgfSlcbiAgICBjb25zdCBmc1dyaXRlU3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odG1wRmlsZW5hbWUpXG4gICAgcmVzcG9uc2VTdHJlYW0ucGlwZShmc1dyaXRlU3RyZWFtKVxuXG4gICAgLy8gSWYgdGhlcmUncyBhIDQwMC81MDAgcmVzcG9uc2Ugb3Igb3RoZXIgZXJyb3IuXG4gICAgcmVzcG9uc2VTdHJlYW0ub24oYGVycm9yYCwgKGVycm9yKSA9PiB7XG4gICAgICBpZiAodGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICAgIH1cbiAgICAgIHByb2Nlc3NpbmdDYWNoZVt1cmxdID0gbnVsbFxuICAgICAgdG90YWxKb2JzIC09IDFcbiAgICAgIGlmICghZml4ZWRCYXJUb3RhbCkge1xuICAgICAgICBiYXIudG90YWwgPSB0b3RhbEpvYnNcbiAgICAgIH1cbiAgICAgIGZzLnJlbW92ZVN5bmModG1wRmlsZW5hbWUpXG4gICAgICByZWplY3QoZXJyb3IpXG4gICAgfSlcblxuICAgIGZzV3JpdGVTdHJlYW0ub24oYGVycm9yYCwgKGVycm9yKSA9PiB7XG4gICAgICBpZiAodGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICAgIH1cbiAgICAgIHByb2Nlc3NpbmdDYWNoZVt1cmxdID0gbnVsbFxuICAgICAgdG90YWxKb2JzIC09IDFcbiAgICAgIGlmICghZml4ZWRCYXJUb3RhbCkge1xuICAgICAgICBiYXIudG90YWwgPSB0b3RhbEpvYnNcbiAgICAgIH1cbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9KVxuXG4gICAgcmVzcG9uc2VTdHJlYW0ub24oYHJlc3BvbnNlYCwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXNldFRpbWVvdXQoKVxuXG4gICAgICBmc1dyaXRlU3RyZWFtLm9uKGBmaW5pc2hgLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpXG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShyZXNwb25zZSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuLyoqXG4gKiBwcm9jZXNzUmVtb3RlTm9kZVxuICogLS1cbiAqIFJlcXVlc3QgdGhlIHJlbW90ZSBmaWxlIGFuZCByZXR1cm4gdGhlIGZpbGVOb2RlXG4gKlxuICogQHBhcmFtIHtDcmVhdGVSZW1vdGVGaWxlTm9kZVBheWxvYWR9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1Byb21pc2U8T2JqZWN0Pn0gUmVzb2x2ZXMgd2l0aCB0aGUgZmlsZU5vZGVcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1JlbW90ZU5vZGUoe1xuICB1cmwsXG4gIGNhY2hlLFxuICBjcmVhdGVOb2RlLFxuICBwYXJlbnROb2RlSWQsXG4gIGF1dGggPSB7fSxcbiAgaHR0cEhlYWRlcnMgPSB7fSxcbiAgY3JlYXRlTm9kZUlkLFxuICBleHQsXG4gIG5hbWUsXG4gIGZpeGVkQmFyVG90YWwsXG59KSB7XG4gIGNvbnN0IHBsdWdpbkNhY2hlRGlyID0gY2FjaGUuZGlyZWN0b3J5XG4gIC8vIFNlZSBpZiB0aGVyZSdzIHJlc3BvbnNlIGhlYWRlcnMgZm9yIHRoaXMgdXJsXG4gIC8vIGZyb20gYSBwcmV2aW91cyByZXF1ZXN0LlxuICBjb25zdCBjYWNoZWRIZWFkZXJzID0gYXdhaXQgY2FjaGUuZ2V0KGNhY2hlSWQodXJsKSlcblxuICBjb25zdCBoZWFkZXJzID0geyAuLi5odHRwSGVhZGVycyB9XG4gIGlmIChjYWNoZWRIZWFkZXJzICYmIGNhY2hlZEhlYWRlcnMuZXRhZykge1xuICAgIGhlYWRlcnNbYElmLU5vbmUtTWF0Y2hgXSA9IGNhY2hlZEhlYWRlcnMuZXRhZ1xuICB9XG5cbiAgLy8gQWRkIGh0YWNjZXNzIGF1dGhlbnRpY2F0aW9uIGlmIHBhc3NlZCBpbi4gVGhpcyBpc24ndCBwYXJ0aWN1bGFybHlcbiAgLy8gZXh0ZW5zaWJsZS4gV2Ugc2hvdWxkIGRlZmluZSBhIHByb3BlciBBUEkgdGhhdCB3ZSB2YWxpZGF0ZS5cbiAgY29uc3QgaHR0cE9wdHMgPSB7fVxuICBpZiAoYXV0aCAmJiAoYXV0aC5odGFjY2Vzc19wYXNzIHx8IGF1dGguaHRhY2Nlc3NfdXNlcikpIHtcbiAgICBodHRwT3B0cy5hdXRoID0gYCR7YXV0aC5odGFjY2Vzc191c2VyfToke2F1dGguaHRhY2Nlc3NfcGFzc31gXG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIHRlbXAgYW5kIHBlcm1hbmVudCBmaWxlIG5hbWVzIGZvciB0aGUgdXJsLlxuICBjb25zdCBkaWdlc3QgPSBjcmVhdGVDb250ZW50RGlnZXN0KHVybClcbiAgaWYgKCFuYW1lKSB7XG4gICAgbmFtZSA9IGdldFJlbW90ZUZpbGVOYW1lKHVybClcbiAgfVxuICBpZiAoIWV4dCkge1xuICAgIGV4dCA9IGdldFJlbW90ZUZpbGVFeHRlbnNpb24odXJsKVxuICB9XG5cbiAgY29uc3QgdG1wRmlsZW5hbWUgPSBjcmVhdGVGaWxlUGF0aChwbHVnaW5DYWNoZURpciwgYHRtcC0ke2RpZ2VzdH1gLCBleHQpXG5cbiAgLy8gRmV0Y2ggdGhlIGZpbGUuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFJlbW90ZU5vZGUoXG4gICAgdXJsLFxuICAgIGhlYWRlcnMsXG4gICAgdG1wRmlsZW5hbWUsXG4gICAgaHR0cE9wdHMsXG4gICAgZml4ZWRCYXJUb3RhbFxuICApXG5cbiAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT0gMjAwKSB7XG4gICAgLy8gU2F2ZSB0aGUgcmVzcG9uc2UgaGVhZGVycyBmb3IgZnV0dXJlIHJlcXVlc3RzLlxuICAgIGF3YWl0IGNhY2hlLnNldChjYWNoZUlkKHVybCksIHJlc3BvbnNlLmhlYWRlcnMpXG4gIH1cblxuICAvLyBJZiB0aGUgdXNlciBkaWQgbm90IHByb3ZpZGUgYW4gZXh0ZW5zaW9uIGFuZCB3ZSBjb3VsZG4ndCBnZXQgb25lIGZyb20gcmVtb3RlIGZpbGUsIHRyeSBhbmQgZ3Vlc3Mgb25lXG4gIGlmIChleHQgPT09IGBgKSB7XG4gICAgY29uc3QgYnVmZmVyID0gcmVhZENodW5rLnN5bmModG1wRmlsZW5hbWUsIDAsIGZpbGVUeXBlLm1pbmltdW1CeXRlcylcbiAgICBjb25zdCBmaWxldHlwZSA9IGZpbGVUeXBlKGJ1ZmZlcilcbiAgICBpZiAoZmlsZXR5cGUpIHtcbiAgICAgIGV4dCA9IGAuJHtmaWxldHlwZS5leHR9YFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGZpbGVuYW1lID0gY3JlYXRlRmlsZVBhdGgocGF0aC5qb2luKHBsdWdpbkNhY2hlRGlyLCBkaWdlc3QpLCBuYW1lLCBleHQpXG4gIC8vIElmIHRoZSBzdGF0dXMgY29kZSBpcyAyMDAsIG1vdmUgdGhlIHBpcGVkIHRlbXAgZmlsZSB0byB0aGUgcmVhbCBuYW1lLlxuICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgYXdhaXQgZnMubW92ZSh0bXBGaWxlbmFtZSwgZmlsZW5hbWUsIHsgb3ZlcndyaXRlOiB0cnVlIH0pXG4gICAgLy8gRWxzZSBpZiAzMDQsIHJlbW92ZSB0aGUgZW1wdHkgcmVzcG9uc2UuXG4gIH0gZWxzZSB7XG4gICAgcHJvY2Vzc2luZ0NhY2hlW3VybF0gPSBudWxsXG4gICAgdG90YWxKb2JzIC09IDFcbiAgICBpZiAoIWZpeGVkQmFyVG90YWwpIHtcbiAgICAgIGJhci50b3RhbCA9IHRvdGFsSm9ic1xuICAgIH1cbiAgICBhd2FpdCBmcy5yZW1vdmUodG1wRmlsZW5hbWUpXG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIGZpbGUgbm9kZS5cbiAgY29uc3QgZmlsZU5vZGUgPSBhd2FpdCBjcmVhdGVGaWxlTm9kZShmaWxlbmFtZSwgY3JlYXRlTm9kZUlkLCB7fSlcbiAgZmlsZU5vZGUuaW50ZXJuYWwuZGVzY3JpcHRpb24gPSBgRmlsZSBcIiR7dXJsfVwiYFxuICBmaWxlTm9kZS51cmwgPSB1cmxcbiAgZmlsZU5vZGUucGFyZW50ID0gcGFyZW50Tm9kZUlkXG4gIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHBsdWdpbiBhcyBnYXRzYnktc291cmNlLWZpbGVzeXN0ZW0gbmVlZHMgdG9cbiAgLy8gYmUgdGhlIG93bmVyIG9mIEZpbGUgbm9kZXMgb3IgdGhlcmUnbGwgYmUgY29uZmxpY3RzIGlmIGFueSBvdGhlclxuICAvLyBGaWxlIG5vZGVzIGFyZSBjcmVhdGVkIHRocm91Z2ggbm9ybWFsIHVzYWdlcyBvZlxuICAvLyBnYXRzYnktc291cmNlLWZpbGVzeXN0ZW0uXG4gIGF3YWl0IGNyZWF0ZU5vZGUoZmlsZU5vZGUsIHsgbmFtZTogYGdhdHNieS1zb3VyY2UtZmlsZXN5c3RlbWAgfSlcblxuICByZXR1cm4gZmlsZU5vZGVcbn1cblxuLyoqXG4gKiBJbmRleCBvZiBwcm9taXNlcyByZXNvbHZpbmcgdG8gRmlsZSBub2RlIGZyb20gcmVtb3RlIHVybFxuICovXG5jb25zdCBwcm9jZXNzaW5nQ2FjaGUgPSB7fVxuLyoqXG4gKiBwdXNoVGFza1xuICogLS1cbiAqIHB1c2hlcyBhIHRhc2sgaW4gdG8gdGhlIFF1ZXVlIGFuZCB0aGUgcHJvY2Vzc2luZyBjYWNoZVxuICpcbiAqIFByb21pc2Z5IGEgdGFzayBpbiBxdWV1ZVxuICogQHBhcmFtIHtDcmVhdGVSZW1vdGVGaWxlTm9kZVBheWxvYWR9IHRhc2tcbiAqIEByZXR1cm4ge1Byb21pc2U8T2JqZWN0Pn1cbiAqL1xuY29uc3QgcHVzaFRhc2sgPSAodGFzaykgPT5cbiAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHF1ZXVlXG4gICAgICAucHVzaCh0YXNrKVxuICAgICAgLm9uKGBmaW5pc2hgLCAodGFzaykgPT4ge1xuICAgICAgICByZXNvbHZlKHRhc2spXG4gICAgICB9KVxuICAgICAgLm9uKGBmYWlsZWRgLCAoZXJyKSA9PiB7XG4gICAgICAgIHJlamVjdChgZmFpbGVkIHRvIHByb2Nlc3MgJHt0YXNrLnVybH1cXG4ke2Vycn1gKVxuICAgICAgfSlcbiAgfSlcblxuLyoqKioqKioqKioqKioqKlxuICogRW50cnkgUG9pbnQgKlxuICoqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBjcmVhdGVSZW1vdGVGaWxlTm9kZVxuICogLS1cbiAqXG4gKiBEb3dubG9hZCBhIHJlbW90ZSBmaWxlXG4gKiBGaXJzdCBjaGVja3MgY2FjaGUgdG8gZW5zdXJlIGR1cGxpY2F0ZSByZXF1ZXN0cyBhcmVuJ3QgcHJvY2Vzc2VkXG4gKiBUaGVuIHB1c2hlcyB0byBhIHF1ZXVlXG4gKlxuICogQHBhcmFtIHtDcmVhdGVSZW1vdGVGaWxlTm9kZVBheWxvYWR9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1Byb21pc2U8T2JqZWN0Pn0gICAgICAgICAgICAgICAgICBSZXR1cm5zIHRoZSBjcmVhdGVkIG5vZGVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoe1xuICB1cmwsXG4gIGNhY2hlLFxuICBjcmVhdGVOb2RlLFxuICBnZXRDYWNoZSxcbiAgZml4ZWRCYXJUb3RhbCxcbiAgcGFyZW50Tm9kZUlkID0gbnVsbCxcbiAgYXV0aCA9IHt9LFxuICBodHRwSGVhZGVycyA9IHt9LFxuICBjcmVhdGVOb2RlSWQsXG4gIGV4dCA9IG51bGwsXG4gIG5hbWUgPSBudWxsLFxuICByZXBvcnRlcixcbn0pID0+IHtcbiAgaWYgKGRvbmVRdWV1ZVRpbWVvdXQpIHtcbiAgICAvLyB0aGlzIGlzIHRvIGdpdmUgdGhlIGJhciBhIGxpdHRsZSB0aW1lIHRvIHdhaXQgd2hlbiB0aGVyZSBhcmUgcGF1c2VzXG4gICAgLy8gYmV0d2VlbiBmaWxlIGRvd25sb2Fkcy5cbiAgICBjbGVhclRpbWVvdXQoZG9uZVF1ZXVlVGltZW91dClcbiAgfVxuXG4gIC8vIHRoaXMgYWNjb3VudHMgZm9yIHNwZWNpYWwgY2hhcmFjdGVycyBpbiBmaWxlbmFtZXNcbiAgdXJsID0gZW5jb2RlVVJJKHVybClcblxuICAvLyB2YWxpZGF0aW9uIG9mIHRoZSBpbnB1dFxuICAvLyB3aXRob3V0IHRoaXMgaXQncyBub3RvcmlvdXNseSBlYXN5IHRvIHBhc3MgaW4gdGhlIHdyb25nIGBjcmVhdGVOb2RlSWRgXG4gIC8vIHNlZSBnYXRzYnlqcy9nYXRzYnkjNjY0M1xuICBpZiAodHlwZW9mIGNyZWF0ZU5vZGVJZCAhPT0gYGZ1bmN0aW9uYCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBjcmVhdGVOb2RlSWQgbXVzdCBiZSBhIGZ1bmN0aW9uLCB3YXMgJHt0eXBlb2YgY3JlYXRlTm9kZUlkfWBcbiAgICApXG4gIH1cbiAgaWYgKHR5cGVvZiBjcmVhdGVOb2RlICE9PSBgZnVuY3Rpb25gKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBjcmVhdGVOb2RlIG11c3QgYmUgYSBmdW5jdGlvbiwgd2FzICR7dHlwZW9mIGNyZWF0ZU5vZGV9YClcbiAgfVxuICBpZiAodHlwZW9mIGdldENhY2hlID09PSBgZnVuY3Rpb25gKSB7XG4gICAgLy8gdXNlIGNhY2hlIG9mIHRoaXMgcGx1Z2luIGFuZCBub3QgY2FjaGUgb2YgZnVuY3Rpb24gY2FsbGVyXG4gICAgY2FjaGUgPSBnZXRDYWNoZShgZ2F0c2J5LXNvdXJjZS1maWxlc3lzdGVtYClcbiAgfVxuICBpZiAodHlwZW9mIGNhY2hlICE9PSBgb2JqZWN0YCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBOZWl0aGVyIFwiY2FjaGVcIiBvciBcImdldENhY2hlXCIgd2FzIHBhc3NlZC4gZ2V0Q2FjaGUgbXVzdCBiZSBmdW5jdGlvbiB0aGF0IHJldHVybiBHYXRzYnkgY2FjaGUsIFwiY2FjaGVcIiBtdXN0IGJlIHRoZSBHYXRzYnkgY2FjaGUsIHdhcyAke3R5cGVvZiBjYWNoZX1gXG4gICAgKVxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgd2UgYWxyZWFkeSByZXF1ZXN0ZWQgbm9kZSBmb3IgdGhpcyByZW1vdGUgZmlsZVxuICAvLyBhbmQgcmV0dXJuIHN0b3JlZCBwcm9taXNlIGlmIHdlIGRpZC5cbiAgaWYgKHByb2Nlc3NpbmdDYWNoZVt1cmxdKSB7XG4gICAgcmV0dXJuIHByb2Nlc3NpbmdDYWNoZVt1cmxdXG4gIH1cblxuICBpZiAoIXVybCB8fCBpc1dlYlVyaSh1cmwpID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYHdyb25nIHVybDogJHt1cmx9YClcbiAgfVxuXG4gIGlmICh0b3RhbEpvYnMgPT09IDApIHtcbiAgICBiYXIgPSBjcmVhdGVQcm9ncmVzcyhgRG93bmxvYWRpbmcgcmVtb3RlIGZpbGVzYCwgcmVwb3J0ZXIpXG4gICAgYmFyLnN0YXJ0KClcbiAgfVxuXG4gIHRvdGFsSm9icyArPSAxXG5cbiAgaWYgKGZpeGVkQmFyVG90YWwpIHtcbiAgICBiYXIudG90YWwgPSBmaXhlZEJhclRvdGFsXG4gIH0gZWxzZSB7XG4gICAgYmFyLnRvdGFsID0gdG90YWxKb2JzXG4gIH1cblxuICBjb25zdCBmaWxlRG93bmxvYWRQcm9taXNlID0gcHVzaFRhc2soe1xuICAgIHVybCxcbiAgICBjYWNoZSxcbiAgICBjcmVhdGVOb2RlLFxuICAgIHBhcmVudE5vZGVJZCxcbiAgICBjcmVhdGVOb2RlSWQsXG4gICAgYXV0aCxcbiAgICBodHRwSGVhZGVycyxcbiAgICBleHQsXG4gICAgbmFtZSxcbiAgICBmaXhlZEJhclRvdGFsLFxuICB9KVxuXG4gIHByb2Nlc3NpbmdDYWNoZVt1cmxdID0gZmlsZURvd25sb2FkUHJvbWlzZS50aGVuKChub2RlKSA9PiB7XG4gICAgYmFyLnRpY2soKVxuXG4gICAgcmV0dXJuIG5vZGVcbiAgfSlcblxuICByZXR1cm4gcHJvY2Vzc2luZ0NhY2hlW3VybF1cbn1cbiJdfQ==