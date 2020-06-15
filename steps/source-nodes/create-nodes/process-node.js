"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.processNode = void 0;

require("source-map-support/register");

var _gatsbyPluginSharp = require("gatsby-plugin-sharp");

var _gatsbyImage = _interopRequireDefault(require("gatsby-image"));

var _react = _interopRequireDefault(require("react"));

var _server = _interopRequireDefault(require("react-dom/server"));

var _fastJsonStableStringify = _interopRequireDefault(require("fast-json-stable-stringify"));

var _execall = _interopRequireDefault(require("execall"));

var _cheerio = _interopRequireDefault(require("cheerio"));

var _url = _interopRequireDefault(require("url"));

var _formatLogMessage = require("../../../utils/format-log-message");

var _index = _interopRequireDefault(require("./create-remote-file-node/index"));

var _fetchReferencedMediaItems = _interopRequireWildcard(require("../fetch-nodes/fetch-referenced-media-items"));

var _btoa = _interopRequireDefault(require("btoa"));

// @todo this doesn't make sense because these aren't all images
const imgSrcRemoteFileRegex = /(?:src=\\")((?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])\.(?:jpeg|jpg|png|gif|ico|pdf|doc|docx|ppt|pptx|pps|ppsx|odt|xls|psd|mp3|m4a|ogg|wav|mp4|m4v|mov|wmv|avi|mpg|ogv|3gp|3g2|svg|bmp|tif|tiff|asf|asx|wm|wmx|divx|flv|qt|mpe|webm|mkv|tt|asc|c|cc|h|csv|tsv|ics|rtx|css|htm|html|m4b|ra|ram|mid|midi|wax|mka|rtf|js|swf|class|tar|zip|gz|gzip|rar|7z|exe|pot|wri|xla|xlt|xlw|mdb|mpp|docm|dotx|dotm|xlsm|xlsb|xltx|xltm|xlam|pptm|ppsm|potx|potm|ppam|sldx|sldm|onetoc|onetoc2|onetmp|onepkg|odp|ods|odg|odc|odb|odf|wp|wpd|key|numbers|pages))(?=\\"| |\.)/gim;
const imgTagRegex = /<img([\w\W]+?)[\/]?>/gim;

const getNodeEditLink = node => {
  const {
    protocol,
    hostname
  } = _url.default.parse(node.link);

  const editUrl = `${protocol}//${hostname}/wp-admin/post.php?post=${node.databaseId}&action=edit`;
  return editUrl;
};

const findReferencedImageNodeIds = ({
  nodeString,
  pluginOptions,
  node
}) => {
  // if the lazyNodes plugin option is set we don't need to find
  // image node id's because those nodes will be fetched lazily in resolvers
  if (pluginOptions.type.MediaItem.lazyNodes) {
    return null;
  } // get an array of all referenced media file ID's


  const matchedIds = (0, _execall.default)(/"id":"([^"]*)","sourceUrl"/gm, nodeString).map(match => match.subMatches[0]).filter(id => id !== node.id);
  return matchedIds;
};

const getCheerioImgDbId = cheerioImg => {
  // try to get the db id from data attributes
  const dataAttributeId = cheerioImg.attribs[`data-id`] || cheerioImg.attribs[`data-image-id`];

  if (dataAttributeId) {
    return dataAttributeId;
  }

  if (!cheerioImg.attribs.class) {
    return null;
  } // try to get the db id from the wp-image-id classname


  const wpImageClass = cheerioImg.attribs.class.split(` `).find(className => className.includes(`wp-image-`));

  if (wpImageClass) {
    const wpImageClassDashArray = wpImageClass.split(`-`);
    const wpImageClassId = Number(wpImageClassDashArray[wpImageClassDashArray.length - 1]);

    if (wpImageClassId) {
      return wpImageClassId;
    }
  }

  return null;
};

const dbIdToMediaItemRelayId = dbId => dbId ? (0, _btoa.default)(`post:${dbId}`) : null;

const getCheerioImgRelayId = cheerioImg => dbIdToMediaItemRelayId(getCheerioImgDbId(cheerioImg));

const fetchNodeHtmlImageMediaItemNodes = async ({
  cheerioImages,
  nodeString,
  node,
  helpers
}) => {
  // @todo check if we have any of these nodes locally already
  const mediaItemUrls = cheerioImages.map(({
    cheerioImg
  }) => cheerioImg.attribs.src); // build a query to fetch all media items that we don't already have

  const mediaItemNodesBySourceUrl = await (0, _fetchReferencedMediaItems.default)({
    mediaItemUrls
  }); // images that have been edited from the media library that were previously
  // uploaded to a post/page will have a different sourceUrl so they can't be fetched by it
  // in many cases we have data-id or data-image-id as attributes on the img
  // we can try to use those to fetch media item nodes as well
  // this will keep us from missing nodes

  const mediaItemDbIds = cheerioImages.map(({
    cheerioImg
  }) => getCheerioImgDbId(cheerioImg)).filter(Boolean); // media items are of the post type

  const mediaItemRelayIds = mediaItemDbIds.map(dbId => dbIdToMediaItemRelayId(dbId)).filter( // filter out any media item ids we already fetched
  relayId => !mediaItemNodesBySourceUrl.find(({
    id
  }) => id === relayId));
  const mediaItemNodesById = await (0, _fetchReferencedMediaItems.default)({
    referencedMediaItemNodeIds: mediaItemRelayIds
  });
  const mediaItemNodes = [...mediaItemNodesById, ...mediaItemNodesBySourceUrl];
  const htmlMatchesToMediaItemNodesMap = new Map();

  for (const {
    cheerioImg,
    match
  } of cheerioImages) {
    const htmlImgSrc = cheerioImg.attribs.src;
    const possibleHtmlSrcs = [// try to match the media item source url by original html src
    htmlImgSrc, // or by the src minus any image sizes string
    (0, _fetchReferencedMediaItems.stripImageSizesFromUrl)(htmlImgSrc)];
    let imageNode = mediaItemNodes.find(mediaItemNode => // either find our node by the source url
    possibleHtmlSrcs.includes(mediaItemNode.sourceUrl) || // or by id for cases where the src url didn't return a node
    getCheerioImgRelayId(cheerioImg) === mediaItemNode.id);

    if (!imageNode && htmlImgSrc) {
      // if we didn't get a media item node for this image,
      // we need to fetch it and create a file node for it with no
      // media item node.
      try {
        imageNode = await (0, _index.default)(Object.assign({
          url: htmlImgSrc,
          // fixedBarTotal,
          parentNodeId: node.id
        }, helpers, {
          createNode: helpers.actions.createNode
        }));
      } catch (e) {
        if (e.includes(`404`)) {
          var _node$title;

          const nodeEditLink = getNodeEditLink(node);
          helpers.reporter.log(``);
          helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`\n\nReceived a 404 when trying to fetch\n${htmlImgSrc}\nfrom ${node.__typename} #${node.databaseId} "${(_node$title = node.title) !== null && _node$title !== void 0 ? _node$title : node.id}"\n\nMost likely this image was uploaded to this ${node.__typename} and then deleted from the media library.\nYou'll need to fix this and re-save this ${node.__typename} to remove this warning at\n${nodeEditLink}.\n\n`));
          imageNode = null;
        } else {
          helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(e));
        }
      }
    }

    if (imageNode) {
      // match is the html string of the img tag
      htmlMatchesToMediaItemNodesMap.set(match, {
        imageNode,
        cheerioImg
      });
    }
  }

  return htmlMatchesToMediaItemNodesMap;
};

const getCheerioImgFromMatch = ({
  match
}) => {
  // unescape quotes
  const parsedMatch = JSON.parse(`"${match}"`); // load our matching img tag into cheerio

  const $ = _cheerio.default.load(parsedMatch, {
    xml: {
      // make sure it's not wrapped in <body></body>
      withDomLvl1: false,
      // no need to normalize whitespace, we're dealing with a single element here
      normalizeWhitespace: false,
      xmlMode: true,
      // entity decoding isn't our job here, that will be the responsibility of WPGQL
      // or of the source plugin elsewhere.
      decodeEntities: false
    }
  }); // there's only ever one image due to our match matching a single img tag
  // $(`img`) isn't an array, it's an object with a key of 0


  const cheerioImg = $(`img`)[0];
  return {
    match,
    cheerioImg
  };
};

const getLargestSizeFromSizesAttribute = sizesString => {
  const sizesStringsArray = sizesString.split(`,`);
  return sizesStringsArray.reduce((largest, currentSizeString) => {
    const maxWidth = currentSizeString.substring(currentSizeString.indexOf(`max-width: `) + 1, currentSizeString.indexOf(`px`)).trim();
    const maxWidthNumber = Number(maxWidth);
    const noLargestAndMaxWidthIsANumber = !largest && !isNaN(maxWidthNumber);
    const maxWidthIsALargerNumberThanLargest = largest && !isNaN(maxWidthNumber) && maxWidthNumber > largest;

    if (noLargestAndMaxWidthIsANumber || maxWidthIsALargerNumberThanLargest) {
      largest = maxWidthNumber;
    }

    return largest;
  }, null);
};

const findImgTagMaxWidthFromCheerioImg = cheerioImg => {
  const {
    attribs: {
      width,
      sizes
    }
  } = cheerioImg || {
    attribs: {
      width: null,
      sizes: null
    }
  };

  if (width) {
    const widthNumber = Number(width);

    if (!isNaN(widthNumber)) {
      return width;
    }
  }

  if (sizes) {
    const largestSize = getLargestSizeFromSizesAttribute(sizes);

    if (largestSize && !isNaN(largestSize)) {
      return largestSize;
    }
  }

  return null;
};

const replaceNodeHtmlImages = async ({
  nodeString,
  node,
  helpers,
  wpUrl,
  pluginOptions
}) => {
  var _pluginOptions$html;

  // this prevents fetching inline html images
  if (!(pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html = pluginOptions.html) === null || _pluginOptions$html === void 0 ? void 0 : _pluginOptions$html.useGatsbyImage)) {
    return nodeString;
  }

  const imageUrlMatches = (0, _execall.default)(imgSrcRemoteFileRegex, nodeString);
  const imgTagMatches = (0, _execall.default)(imgTagRegex, nodeString).filter(({
    match
  }) => {
    // @todo make it a plugin option to fetch non-wp images
    // here we're filtering out image tags that don't contain our site url
    const isHostedInWp = match.includes(wpUrl);
    return isHostedInWp;
  });

  if (imageUrlMatches.length) {
    const cheerioImages = imgTagMatches.map(getCheerioImgFromMatch);
    const htmlMatchesToMediaItemNodesMap = await fetchNodeHtmlImageMediaItemNodes({
      cheerioImages,
      nodeString,
      node,
      helpers
    }); // generate gatsby images for each cheerioImage

    const htmlMatchesWithImageResizes = await Promise.all(imgTagMatches.map(async ({
      match
    }) => {
      var _imageNode$mediaDetai, _pluginOptions$html2, _ref, _pluginOptions$html3;

      const matchInfo = htmlMatchesToMediaItemNodesMap.get(match);

      if (!matchInfo) {
        return null;
      }

      const {
        imageNode,
        cheerioImg
      } = matchInfo;
      const isMediaItemNode = imageNode.__typename === `MediaItem`;

      if (!imageNode) {
        return null;
      }

      const fileNode = // if we couldn't get a MediaItem node for this image in WPGQL
      !isMediaItemNode ? // this will already be a file node
      imageNode : // otherwise grab the file node
      helpers.getNode(imageNode.localFile.id);
      const imgTagMaxWidth = findImgTagMaxWidthFromCheerioImg(cheerioImg);
      const mediaItemNodeWidth = isMediaItemNode ? imageNode === null || imageNode === void 0 ? void 0 : (_imageNode$mediaDetai = imageNode.mediaDetails) === null || _imageNode$mediaDetai === void 0 ? void 0 : _imageNode$mediaDetai.width : null; // if a max width can't be inferred from html, this value will be passed to Sharp

      let fallbackImageMaxWidth = pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html2 = pluginOptions.html) === null || _pluginOptions$html2 === void 0 ? void 0 : _pluginOptions$html2.fallbackImageMaxWidth;

      if ( // if the image is smaller than the fallback max width,
      // the images width will be used instead if we have a media item node
      fallbackImageMaxWidth > mediaItemNodeWidth && // of course that means we have to have a media item node
      // and a media item node max width
      mediaItemNodeWidth && typeof mediaItemNodeWidth === `number` && mediaItemNodeWidth > 0) {
        fallbackImageMaxWidth = mediaItemNodeWidth;
      }

      const maxWidth = // if we inferred a maxwidth from html
      (_ref = imgTagMaxWidth && // and we have a media item node to know it's full size max width
      mediaItemNodeWidth && // and the media item node max width is smaller than what we inferred
      // from html
      mediaItemNodeWidth < imgTagMaxWidth ? // use the media item node width
      mediaItemNodeWidth : // otherwise use the width inferred from html
      imgTagMaxWidth) !== null && _ref !== void 0 ? _ref : // if we don't have a media item node and we inferred no width
      // from html, then use the fallback max width from plugin options
      fallbackImageMaxWidth;
      const quality = pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html3 = pluginOptions.html) === null || _pluginOptions$html3 === void 0 ? void 0 : _pluginOptions$html3.imageQuality;
      const {
        reporter,
        cache,
        pathPrefix
      } = helpers;
      let fluidResult;

      try {
        fluidResult = await (0, _gatsbyPluginSharp.fluid)({
          file: fileNode,
          args: {
            maxWidth,
            quality,
            pathPrefix
          },
          reporter,
          cache
        });
      } catch (e) {
        reporter.error(e);
        reporter.warn((0, _formatLogMessage.formatLogMessage)(`${node.__typename} ${node.id} couldn't process inline html image ${fileNode.url}`));
        return null;
      }

      return {
        match,
        cheerioImg,
        fileNode,
        imageResize: fluidResult,
        maxWidth
      };
    })); // find/replace mutate nodeString to replace matched images with rendered gatsby images

    for (const matchResize of htmlMatchesWithImageResizes) {
      var _cheerioImg$attribs, _cheerioImg$attribs2;

      if (!matchResize) {
        continue;
      }

      const {
        match,
        imageResize,
        cheerioImg,
        maxWidth
      } = matchResize; // @todo retain img tag classes and attributes from cheerioImg

      const imgOptions = {
        fluid: imageResize,
        style: {
          // these styles make it so that the image wont be stretched
          // beyond it's max width, but it also wont exceed the width
          // of it's parent element
          maxWidth: "100%",
          width: `${maxWidth}px`
        },
        className: cheerioImg === null || cheerioImg === void 0 ? void 0 : (_cheerioImg$attribs = cheerioImg.attribs) === null || _cheerioImg$attribs === void 0 ? void 0 : _cheerioImg$attribs.class,
        // Force show full image instantly
        loading: "eager",
        alt: cheerioImg === null || cheerioImg === void 0 ? void 0 : (_cheerioImg$attribs2 = cheerioImg.attribs) === null || _cheerioImg$attribs2 === void 0 ? void 0 : _cheerioImg$attribs2.alt,
        fadeIn: true,
        imgStyle: {
          opacity: 1
        }
      };

      const ReactGatsbyImage = /*#__PURE__*/_react.default.createElement(_gatsbyImage.default, imgOptions, null);

      const gatsbyImageStringJSON = JSON.stringify(_server.default.renderToString(ReactGatsbyImage)); // need to remove the JSON stringify quotes around our image since we're
      // threading this JSON string back into a larger JSON object string

      const gatsbyImageString = gatsbyImageStringJSON.substring(1, gatsbyImageStringJSON.length - 1); // replace match with react string in nodeString

      nodeString = nodeString.replace(match, gatsbyImageString);
    }
  }

  return nodeString;
}; // replaces any url which is a front-end WP url with a relative path


const replaceNodeHtmlLinks = ({
  wpUrl,
  nodeString,
  node
}) => {
  const wpLinkRegex = new RegExp(`["']${wpUrl}(?!/wp-content|/wp-admin|/wp-includes)(/[^'"]+)["']`, `gim`);
  const linkMatches = (0, _execall.default)(wpLinkRegex, nodeString);

  if (linkMatches.length) {
    linkMatches.forEach(({
      match,
      subMatches: [path]
    }) => {
      if (path) {
        try {
          // remove \, " and ' characters from match
          const normalizedMatch = match.replace(/['"\\]/g, ``);
          const normalizedPath = path.replace(/\\/g, ``); // replace normalized match with relative path

          const thisMatchRegex = new RegExp(normalizedMatch, `g`);
          nodeString = nodeString.replace(thisMatchRegex, normalizedPath);
        } catch (e) {
          console.error(e);
          console.warning((0, _formatLogMessage.formatLogMessage)(`Failed to process inline html links in ${node.__typename} ${node.id}`));
        }
      }
    });
  }

  return nodeString;
};

const processNodeString = async ({
  nodeString,
  node,
  pluginOptions,
  helpers,
  wpUrl
}) => {
  const nodeStringFilters = [replaceNodeHtmlImages, replaceNodeHtmlLinks];

  for (const nodeStringFilter of nodeStringFilters) {
    nodeString = await nodeStringFilter({
      nodeString,
      node,
      pluginOptions,
      helpers,
      wpUrl
    });
  }

  return nodeString;
};

const processNode = async ({
  node,
  pluginOptions,
  wpUrl,
  helpers,
  referencedMediaItemNodeIds
}) => {
  const nodeString = (0, _fastJsonStableStringify.default)(node); // find referenced node ids
  // here we're searching for node id strings in our node
  // we use this to download only the media items
  // that are being used in posts
  // this is important for downloading images nodes that are connected somewhere
  // on a node field

  const nodeMediaItemIdReferences = findReferencedImageNodeIds({
    nodeString,
    pluginOptions,
    node
  }); // push them to our store of referenced id's

  if ((nodeMediaItemIdReferences === null || nodeMediaItemIdReferences === void 0 ? void 0 : nodeMediaItemIdReferences.length) && referencedMediaItemNodeIds) {
    nodeMediaItemIdReferences.forEach(id => referencedMediaItemNodeIds.add(id));
  }

  const processedNodeString = await processNodeString({
    nodeString,
    node,
    pluginOptions,
    helpers,
    wpUrl
  }); // only parse if the nodeString has changed

  if (processedNodeString !== nodeString) {
    return JSON.parse(processedNodeString);
  } else {
    return node;
  }
};

exports.processNode = processNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvY3JlYXRlLW5vZGVzL3Byb2Nlc3Mtbm9kZS5qcyJdLCJuYW1lcyI6WyJpbWdTcmNSZW1vdGVGaWxlUmVnZXgiLCJpbWdUYWdSZWdleCIsImdldE5vZGVFZGl0TGluayIsIm5vZGUiLCJwcm90b2NvbCIsImhvc3RuYW1lIiwidXJsIiwicGFyc2UiLCJsaW5rIiwiZWRpdFVybCIsImRhdGFiYXNlSWQiLCJmaW5kUmVmZXJlbmNlZEltYWdlTm9kZUlkcyIsIm5vZGVTdHJpbmciLCJwbHVnaW5PcHRpb25zIiwidHlwZSIsIk1lZGlhSXRlbSIsImxhenlOb2RlcyIsIm1hdGNoZWRJZHMiLCJtYXAiLCJtYXRjaCIsInN1Yk1hdGNoZXMiLCJmaWx0ZXIiLCJpZCIsImdldENoZWVyaW9JbWdEYklkIiwiY2hlZXJpb0ltZyIsImRhdGFBdHRyaWJ1dGVJZCIsImF0dHJpYnMiLCJjbGFzcyIsIndwSW1hZ2VDbGFzcyIsInNwbGl0IiwiZmluZCIsImNsYXNzTmFtZSIsImluY2x1ZGVzIiwid3BJbWFnZUNsYXNzRGFzaEFycmF5Iiwid3BJbWFnZUNsYXNzSWQiLCJOdW1iZXIiLCJsZW5ndGgiLCJkYklkVG9NZWRpYUl0ZW1SZWxheUlkIiwiZGJJZCIsImdldENoZWVyaW9JbWdSZWxheUlkIiwiZmV0Y2hOb2RlSHRtbEltYWdlTWVkaWFJdGVtTm9kZXMiLCJjaGVlcmlvSW1hZ2VzIiwiaGVscGVycyIsIm1lZGlhSXRlbVVybHMiLCJzcmMiLCJtZWRpYUl0ZW1Ob2Rlc0J5U291cmNlVXJsIiwibWVkaWFJdGVtRGJJZHMiLCJCb29sZWFuIiwibWVkaWFJdGVtUmVsYXlJZHMiLCJyZWxheUlkIiwibWVkaWFJdGVtTm9kZXNCeUlkIiwicmVmZXJlbmNlZE1lZGlhSXRlbU5vZGVJZHMiLCJtZWRpYUl0ZW1Ob2RlcyIsImh0bWxNYXRjaGVzVG9NZWRpYUl0ZW1Ob2Rlc01hcCIsIk1hcCIsImh0bWxJbWdTcmMiLCJwb3NzaWJsZUh0bWxTcmNzIiwiaW1hZ2VOb2RlIiwibWVkaWFJdGVtTm9kZSIsInNvdXJjZVVybCIsInBhcmVudE5vZGVJZCIsImNyZWF0ZU5vZGUiLCJhY3Rpb25zIiwiZSIsIm5vZGVFZGl0TGluayIsInJlcG9ydGVyIiwibG9nIiwid2FybiIsIl9fdHlwZW5hbWUiLCJ0aXRsZSIsInBhbmljIiwic2V0IiwiZ2V0Q2hlZXJpb0ltZ0Zyb21NYXRjaCIsInBhcnNlZE1hdGNoIiwiSlNPTiIsIiQiLCJjaGVlcmlvIiwibG9hZCIsInhtbCIsIndpdGhEb21MdmwxIiwibm9ybWFsaXplV2hpdGVzcGFjZSIsInhtbE1vZGUiLCJkZWNvZGVFbnRpdGllcyIsImdldExhcmdlc3RTaXplRnJvbVNpemVzQXR0cmlidXRlIiwic2l6ZXNTdHJpbmciLCJzaXplc1N0cmluZ3NBcnJheSIsInJlZHVjZSIsImxhcmdlc3QiLCJjdXJyZW50U2l6ZVN0cmluZyIsIm1heFdpZHRoIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsInRyaW0iLCJtYXhXaWR0aE51bWJlciIsIm5vTGFyZ2VzdEFuZE1heFdpZHRoSXNBTnVtYmVyIiwiaXNOYU4iLCJtYXhXaWR0aElzQUxhcmdlck51bWJlclRoYW5MYXJnZXN0IiwiZmluZEltZ1RhZ01heFdpZHRoRnJvbUNoZWVyaW9JbWciLCJ3aWR0aCIsInNpemVzIiwid2lkdGhOdW1iZXIiLCJsYXJnZXN0U2l6ZSIsInJlcGxhY2VOb2RlSHRtbEltYWdlcyIsIndwVXJsIiwiaHRtbCIsInVzZUdhdHNieUltYWdlIiwiaW1hZ2VVcmxNYXRjaGVzIiwiaW1nVGFnTWF0Y2hlcyIsImlzSG9zdGVkSW5XcCIsImh0bWxNYXRjaGVzV2l0aEltYWdlUmVzaXplcyIsIlByb21pc2UiLCJhbGwiLCJtYXRjaEluZm8iLCJnZXQiLCJpc01lZGlhSXRlbU5vZGUiLCJmaWxlTm9kZSIsImdldE5vZGUiLCJsb2NhbEZpbGUiLCJpbWdUYWdNYXhXaWR0aCIsIm1lZGlhSXRlbU5vZGVXaWR0aCIsIm1lZGlhRGV0YWlscyIsImZhbGxiYWNrSW1hZ2VNYXhXaWR0aCIsInF1YWxpdHkiLCJpbWFnZVF1YWxpdHkiLCJjYWNoZSIsInBhdGhQcmVmaXgiLCJmbHVpZFJlc3VsdCIsImZpbGUiLCJhcmdzIiwiZXJyb3IiLCJpbWFnZVJlc2l6ZSIsIm1hdGNoUmVzaXplIiwiaW1nT3B0aW9ucyIsImZsdWlkIiwic3R5bGUiLCJsb2FkaW5nIiwiYWx0IiwiZmFkZUluIiwiaW1nU3R5bGUiLCJvcGFjaXR5IiwiUmVhY3RHYXRzYnlJbWFnZSIsIlJlYWN0IiwiY3JlYXRlRWxlbWVudCIsIkltZyIsImdhdHNieUltYWdlU3RyaW5nSlNPTiIsInN0cmluZ2lmeSIsIlJlYWN0RE9NU2VydmVyIiwicmVuZGVyVG9TdHJpbmciLCJnYXRzYnlJbWFnZVN0cmluZyIsInJlcGxhY2UiLCJyZXBsYWNlTm9kZUh0bWxMaW5rcyIsIndwTGlua1JlZ2V4IiwiUmVnRXhwIiwibGlua01hdGNoZXMiLCJmb3JFYWNoIiwicGF0aCIsIm5vcm1hbGl6ZWRNYXRjaCIsIm5vcm1hbGl6ZWRQYXRoIiwidGhpc01hdGNoUmVnZXgiLCJjb25zb2xlIiwid2FybmluZyIsInByb2Nlc3NOb2RlU3RyaW5nIiwibm9kZVN0cmluZ0ZpbHRlcnMiLCJub2RlU3RyaW5nRmlsdGVyIiwicHJvY2Vzc05vZGUiLCJub2RlTWVkaWFJdGVtSWRSZWZlcmVuY2VzIiwiYWRkIiwicHJvY2Vzc2VkTm9kZVN0cmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTtBQUNBLE1BQU1BLHFCQUFxQixHQUFHLG1wQkFBOUI7QUFFQSxNQUFNQyxXQUFXLEdBQUcseUJBQXBCOztBQUVBLE1BQU1DLGVBQWUsR0FBSUMsSUFBRCxJQUFVO0FBQ2hDLFFBQU07QUFBRUMsSUFBQUEsUUFBRjtBQUFZQyxJQUFBQTtBQUFaLE1BQXlCQyxhQUFJQyxLQUFKLENBQVVKLElBQUks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RUFBcUU7QUFDbkVrSCxJQUFBQSx5QkFBeUIsQ0FBQ1gsT0FBMUIsQ0FBbUNwSSxFQUFELElBQ2hDNkIsMEJBQTBCLENBQUNtSCxHQUEzQixDQUErQmhKLEVBQS9CLENBREY7QUFHRDs7QUFFRCxRQUFNaUosbUJBQW1CLEdBQUcsTUFBTU4saUJBQWlCLENBQUM7QUFDbERySixJQUFBQSxVQURrRDtBQUVsRFQsSUFBQUEsSUFGa0Q7QUFHbERVLElBQUFBLGFBSGtEO0FBSWxENkIsSUFBQUEsT0FKa0Q7QUFLbEQ2RCxJQUFBQTtBQUxrRCxHQUFELENBQW5ELENBdEJJLENBOEJKOztBQUNBLE1BQUlnRSxtQkFBbUIsS0FBSzNKLFVBQTVCLEVBQXdDO0FBQ3RDLFdBQU84RCxJQUFJLENBQUNuRSxLQUFMLENBQVdnSyxtQkFBWCxDQUFQO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsV0FBT3BLLElBQVA7QUFDRDtBQUNGLENBMUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmx1aWQgfSBmcm9tIFwiZ2F0c2J5LXBsdWdpbi1zaGFycFwiXG5pbXBvcnQgSW1nIGZyb20gXCJnYXRzYnktaW1hZ2VcIlxuaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiXG5pbXBvcnQgUmVhY3RET01TZXJ2ZXIgZnJvbSBcInJlYWN0LWRvbS9zZXJ2ZXJcIlxuaW1wb3J0IHN0cmluZ2lmeSBmcm9tIFwiZmFzdC1qc29uLXN0YWJsZS1zdHJpbmdpZnlcIlxuaW1wb3J0IGV4ZWNhbGwgZnJvbSBcImV4ZWNhbGxcIlxuaW1wb3J0IGNoZWVyaW8gZnJvbSBcImNoZWVyaW9cIlxuaW1wb3J0IHVybCBmcm9tIFwidXJsXCJcblxuaW1wb3J0IHsgZm9ybWF0TG9nTWVzc2FnZSB9IGZyb20gXCJ+L3V0aWxzL2Zvcm1hdC1sb2ctbWVzc2FnZVwiXG5pbXBvcnQgY3JlYXRlUmVtb3RlRmlsZU5vZGUgZnJvbSBcIi4vY3JlYXRlLXJlbW90ZS1maWxlLW5vZGUvaW5kZXhcIlxuaW1wb3J0IGZldGNoUmVmZXJlbmNlZE1lZGlhSXRlbXNBbmRDcmVhdGVOb2Rlcywge1xuICBzdHJpcEltYWdlU2l6ZXNGcm9tVXJsLFxufSBmcm9tIFwiLi4vZmV0Y2gtbm9kZXMvZmV0Y2gtcmVmZXJlbmNlZC1tZWRpYS1pdGVtc1wiXG5pbXBvcnQgYnRvYSBmcm9tIFwiYnRvYVwiXG5cbi8vIEB0b2RvIHRoaXMgZG9lc24ndCBtYWtlIHNlbnNlIGJlY2F1c2UgdGhlc2UgYXJlbid0IGFsbCBpbWFnZXNcbmNvbnN0IGltZ1NyY1JlbW90ZUZpbGVSZWdleCA9IC8oPzpzcmM9XFxcXFwiKSgoPzooPzpodHRwcz98ZnRwfGZpbGUpOlxcL1xcL3x3d3dcXC58ZnRwXFwuKSg/OlxcKFstQS1aMC05KyZAIy8lPX5ffCQ/ITosLl0qXFwpfFstQS1aMC05KyZAIy8lPX5ffCQ/ITosLl0pKig/OlxcKFstQS1aMC05KyZAIy8lPX5ffCQ/ITosLl0qXFwpfFtBLVowLTkrJkAjLyU9fl98JF0pXFwuKD86anBlZ3xqcGd8cG5nfGdpZnxpY298cGRmfGRvY3xkb2N4fHBwdHxwcHR4fHBwc3xwcHN4fG9kdHx4bHN8cHNkfG1wM3xtNGF8b2dnfHdhdnxtcDR8bTR2fG1vdnx3bXZ8YXZpfG1wZ3xvZ3Z8M2dwfDNnMnxzdmd8Ym1wfHRpZnx0aWZmfGFzZnxhc3h8d218d214fGRpdnh8Zmx2fHF0fG1wZXx3ZWJtfG1rdnx0dHxhc2N8Y3xjY3xofGNzdnx0c3Z8aWNzfHJ0eHxjc3N8aHRtfGh0bWx8bTRifHJhfHJhbXxtaWR8bWlkaXx3YXh8bWthfHJ0Znxqc3xzd2Z8Y2xhc3N8dGFyfHppcHxnenxnemlwfHJhcnw3enxleGV8cG90fHdyaXx4bGF8eGx0fHhsd3xtZGJ8bXBwfGRvY218ZG90eHxkb3RtfHhsc218eGxzYnx4bHR4fHhsdG18eGxhbXxwcHRtfHBwc218cG90eHxwb3RtfHBwYW18c2xkeHxzbGRtfG9uZXRvY3xvbmV0b2MyfG9uZXRtcHxvbmVwa2d8b2RwfG9kc3xvZGd8b2RjfG9kYnxvZGZ8d3B8d3BkfGtleXxudW1iZXJzfHBhZ2VzKSkoPz1cXFxcXCJ8IHxcXC4pL2dpbVxuXG5jb25zdCBpbWdUYWdSZWdleCA9IC88aW1nKFtcXHdcXFddKz8pW1xcL10/Pi9naW1cblxuY29uc3QgZ2V0Tm9kZUVkaXRMaW5rID0gKG5vZGUpID0+IHtcbiAgY29uc3QgeyBwcm90b2NvbCwgaG9zdG5hbWUgfSA9IHVybC5wYXJzZShub2RlLmxpbmspXG4gIGNvbnN0IGVkaXRVcmwgPSBgJHtwcm90b2NvbH0vLyR7aG9zdG5hbWV9L3dwLWFkbWluL3Bvc3QucGhwP3Bvc3Q9JHtub2RlLmRhdGFiYXNlSWR9JmFjdGlvbj1lZGl0YFxuXG4gIHJldHVybiBlZGl0VXJsXG59XG5cbmNvbnN0IGZpbmRSZWZlcmVuY2VkSW1hZ2VOb2RlSWRzID0gKHsgbm9kZVN0cmluZywgcGx1Z2luT3B0aW9ucywgbm9kZSB9KSA9PiB7XG4gIC8vIGlmIHRoZSBsYXp5Tm9kZXMgcGx1Z2luIG9wdGlvbiBpcyBzZXQgd2UgZG9uJ3QgbmVlZCB0byBmaW5kXG4gIC8vIGltYWdlIG5vZGUgaWQncyBiZWNhdXNlIHRob3NlIG5vZGVzIHdpbGwgYmUgZmV0Y2hlZCBsYXppbHkgaW4gcmVzb2x2ZXJzXG4gIGlmIChwbHVnaW5PcHRpb25zLnR5cGUuTWVkaWFJdGVtLmxhenlOb2Rlcykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBnZXQgYW4gYXJyYXkgb2YgYWxsIHJlZmVyZW5jZWQgbWVkaWEgZmlsZSBJRCdzXG4gIGNvbnN0IG1hdGNoZWRJZHMgPSBleGVjYWxsKC9cImlkXCI6XCIoW15cIl0qKVwiLFwic291cmNlVXJsXCIvZ20sIG5vZGVTdHJpbmcpXG4gICAgLm1hcCgobWF0Y2gpID0+IG1hdGNoLnN1Yk1hdGNoZXNbMF0pXG4gICAgLmZpbHRlcigoaWQpID0+IGlkICE9PSBub2RlLmlkKVxuXG4gIHJldHVybiBtYXRjaGVkSWRzXG59XG5cbmNvbnN0IGdldENoZWVyaW9JbWdEYklkID0gKGNoZWVyaW9JbWcpID0+IHtcbiAgLy8gdHJ5IHRvIGdldCB0aGUgZGIgaWQgZnJvbSBkYXRhIGF0dHJpYnV0ZXNcbiAgY29uc3QgZGF0YUF0dHJpYnV0ZUlkID1cbiAgICBjaGVlcmlvSW1nLmF0dHJpYnNbYGRhdGEtaWRgXSB8fCBjaGVlcmlvSW1nLmF0dHJpYnNbYGRhdGEtaW1hZ2UtaWRgXVxuXG4gIGlmIChkYXRhQXR0cmlidXRlSWQpIHtcbiAgICByZXR1cm4gZGF0YUF0dHJpYnV0ZUlkXG4gIH1cblxuICBpZiAoIWNoZWVyaW9JbWcuYXR0cmlicy5jbGFzcykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyB0cnkgdG8gZ2V0IHRoZSBkYiBpZCBmcm9tIHRoZSB3cC1pbWFnZS1pZCBjbGFzc25hbWVcbiAgY29uc3Qgd3BJbWFnZUNsYXNzID0gY2hlZXJpb0ltZy5hdHRyaWJzLmNsYXNzXG4gICAgLnNwbGl0KGAgYClcbiAgICAuZmluZCgoY2xhc3NOYW1lKSA9PiBjbGFzc05hbWUuaW5jbHVkZXMoYHdwLWltYWdlLWApKVxuXG4gIGlmICh3cEltYWdlQ2xhc3MpIHtcbiAgICBjb25zdCB3cEltYWdlQ2xhc3NEYXNoQXJyYXkgPSB3cEltYWdlQ2xhc3Muc3BsaXQoYC1gKVxuICAgIGNvbnN0IHdwSW1hZ2VDbGFzc0lkID0gTnVtYmVyKFxuICAgICAgd3BJbWFnZUNsYXNzRGFzaEFycmF5W3dwSW1hZ2VDbGFzc0Rhc2hBcnJheS5sZW5ndGggLSAxXVxuICAgIClcblxuICAgIGlmICh3cEltYWdlQ2xhc3NJZCkge1xuICAgICAgcmV0dXJuIHdwSW1hZ2VDbGFzc0lkXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cblxuY29uc3QgZGJJZFRvTWVkaWFJdGVtUmVsYXlJZCA9IChkYklkKSA9PiAoZGJJZCA/IGJ0b2EoYHBvc3Q6JHtkYklkfWApIDogbnVsbClcblxuY29uc3QgZ2V0Q2hlZXJpb0ltZ1JlbGF5SWQgPSAoY2hlZXJpb0ltZykgPT5cbiAgZGJJZFRvTWVkaWFJdGVtUmVsYXlJZChnZXRDaGVlcmlvSW1nRGJJZChjaGVlcmlvSW1nKSlcblxuY29uc3QgZmV0Y2hOb2RlSHRtbEltYWdlTWVkaWFJdGVtTm9kZXMgPSBhc3luYyAoe1xuICBjaGVlcmlvSW1hZ2VzLFxuICBub2RlU3RyaW5nLFxuICBub2RlLFxuICBoZWxwZXJzLFxufSkgPT4ge1xuICAvLyBAdG9kbyBjaGVjayBpZiB3ZSBoYXZlIGFueSBvZiB0aGVzZSBub2RlcyBsb2NhbGx5IGFscmVhZHlcbiAgY29uc3QgbWVkaWFJdGVtVXJscyA9IGNoZWVyaW9JbWFnZXMubWFwKFxuICAgICh7IGNoZWVyaW9JbWcgfSkgPT4gY2hlZXJpb0ltZy5hdHRyaWJzLnNyY1xuICApXG5cbiAgLy8gYnVpbGQgYSBxdWVyeSB0byBmZXRjaCBhbGwgbWVkaWEgaXRlbXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IGhhdmVcbiAgY29uc3QgbWVkaWFJdGVtTm9kZXNCeVNvdXJjZVVybCA9IGF3YWl0IGZldGNoUmVmZXJlbmNlZE1lZGlhSXRlbXNBbmRDcmVhdGVOb2RlcyhcbiAgICB7XG4gICAgICBtZWRpYUl0ZW1VcmxzLFxuICAgIH1cbiAgKVxuXG4gIC8vIGltYWdlcyB0aGF0IGhhdmUgYmVlbiBlZGl0ZWQgZnJvbSB0aGUgbWVkaWEgbGlicmFyeSB0aGF0IHdlcmUgcHJldmlvdXNseVxuICAvLyB1cGxvYWRlZCB0byBhIHBvc3QvcGFnZSB3aWxsIGhhdmUgYSBkaWZmZXJlbnQgc291cmNlVXJsIHNvIHRoZXkgY2FuJ3QgYmUgZmV0Y2hlZCBieSBpdFxuICAvLyBpbiBtYW55IGNhc2VzIHdlIGhhdmUgZGF0YS1pZCBvciBkYXRhLWltYWdlLWlkIGFzIGF0dHJpYnV0ZXMgb24gdGhlIGltZ1xuICAvLyB3ZSBjYW4gdHJ5IHRvIHVzZSB0aG9zZSB0byBmZXRjaCBtZWRpYSBpdGVtIG5vZGVzIGFzIHdlbGxcbiAgLy8gdGhpcyB3aWxsIGtlZXAgdXMgZnJvbSBtaXNzaW5nIG5vZGVzXG4gIGNvbnN0IG1lZGlhSXRlbURiSWRzID0gY2hlZXJpb0ltYWdlc1xuICAgIC5tYXAoKHsgY2hlZXJpb0ltZyB9KSA9PiBnZXRDaGVlcmlvSW1nRGJJZChjaGVlcmlvSW1nKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG5cbiAgLy8gbWVkaWEgaXRlbXMgYXJlIG9mIHRoZSBwb3N0IHR5cGVcbiAgY29uc3QgbWVkaWFJdGVtUmVsYXlJZHMgPSBtZWRpYUl0ZW1EYklkc1xuICAgIC5tYXAoKGRiSWQpID0+IGRiSWRUb01lZGlhSXRlbVJlbGF5SWQoZGJJZCkpXG4gICAgLmZpbHRlcihcbiAgICAgIC8vIGZpbHRlciBvdXQgYW55IG1lZGlhIGl0ZW0gaWRzIHdlIGFscmVhZHkgZmV0Y2hlZFxuICAgICAgKHJlbGF5SWQpID0+ICFtZWRpYUl0ZW1Ob2Rlc0J5U291cmNlVXJsLmZpbmQoKHsgaWQgfSkgPT4gaWQgPT09IHJlbGF5SWQpXG4gICAgKVxuXG4gIGNvbnN0IG1lZGlhSXRlbU5vZGVzQnlJZCA9IGF3YWl0IGZldGNoUmVmZXJlbmNlZE1lZGlhSXRlbXNBbmRDcmVhdGVOb2Rlcyh7XG4gICAgcmVmZXJlbmNlZE1lZGlhSXRlbU5vZGVJZHM6IG1lZGlhSXRlbVJlbGF5SWRzLFxuICB9KVxuXG4gIGNvbnN0IG1lZGlhSXRlbU5vZGVzID0gWy4uLm1lZGlhSXRlbU5vZGVzQnlJZCwgLi4ubWVkaWFJdGVtTm9kZXNCeVNvdXJjZVVybF1cblxuICBjb25zdCBodG1sTWF0Y2hlc1RvTWVkaWFJdGVtTm9kZXNNYXAgPSBuZXcgTWFwKClcbiAgZm9yIChjb25zdCB7IGNoZWVyaW9JbWcsIG1hdGNoIH0gb2YgY2hlZXJpb0ltYWdlcykge1xuICAgIGNvbnN0IGh0bWxJbWdTcmMgPSBjaGVlcmlvSW1nLmF0dHJpYnMuc3JjXG5cbiAgICBjb25zdCBwb3NzaWJsZUh0bWxTcmNzID0gW1xuICAgICAgLy8gdHJ5IHRvIG1hdGNoIHRoZSBtZWRpYSBpdGVtIHNvdXJjZSB1cmwgYnkgb3JpZ2luYWwgaHRtbCBzcmNcbiAgICAgIGh0bWxJbWdTcmMsXG4gICAgICAvLyBvciBieSB0aGUgc3JjIG1pbnVzIGFueSBpbWFnZSBzaXplcyBzdHJpbmdcbiAgICAgIHN0cmlwSW1hZ2VTaXplc0Zyb21VcmwoaHRtbEltZ1NyYyksXG4gICAgXVxuXG4gICAgbGV0IGltYWdlTm9kZSA9IG1lZGlhSXRlbU5vZGVzLmZpbmQoXG4gICAgICAobWVkaWFJdGVtTm9kZSkgPT5cbiAgICAgICAgLy8gZWl0aGVyIGZpbmQgb3VyIG5vZGUgYnkgdGhlIHNvdXJjZSB1cmxcbiAgICAgICAgcG9zc2libGVIdG1sU3Jjcy5pbmNsdWRlcyhtZWRpYUl0ZW1Ob2RlLnNvdXJjZVVybCkgfHxcbiAgICAgICAgLy8gb3IgYnkgaWQgZm9yIGNhc2VzIHdoZXJlIHRoZSBzcmMgdXJsIGRpZG4ndCByZXR1cm4gYSBub2RlXG4gICAgICAgIGdldENoZWVyaW9JbWdSZWxheUlkKGNoZWVyaW9JbWcpID09PSBtZWRpYUl0ZW1Ob2RlLmlkXG4gICAgKVxuXG4gICAgaWYgKCFpbWFnZU5vZGUgJiYgaHRtbEltZ1NyYykge1xuICAgICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIG1lZGlhIGl0ZW0gbm9kZSBmb3IgdGhpcyBpbWFnZSxcbiAgICAgIC8vIHdlIG5lZWQgdG8gZmV0Y2ggaXQgYW5kIGNyZWF0ZSBhIGZpbGUgbm9kZSBmb3IgaXQgd2l0aCBub1xuICAgICAgLy8gbWVkaWEgaXRlbSBub2RlLlxuICAgICAgdHJ5IHtcbiAgICAgICAgaW1hZ2VOb2RlID0gYXdhaXQgY3JlYXRlUmVtb3RlRmlsZU5vZGUoe1xuICAgICAgICAgIHVybDogaHRtbEltZ1NyYyxcbiAgICAgICAgICAvLyBmaXhlZEJhclRvdGFsLFxuICAgICAgICAgIHBhcmVudE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAuLi5oZWxwZXJzLFxuICAgICAgICAgIGNyZWF0ZU5vZGU6IGhlbHBlcnMuYWN0aW9ucy5jcmVhdGVOb2RlLFxuICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZS5pbmNsdWRlcyhgNDA0YCkpIHtcbiAgICAgICAgICBjb25zdCBub2RlRWRpdExpbmsgPSBnZXROb2RlRWRpdExpbmsobm9kZSlcbiAgICAgICAgICBoZWxwZXJzLnJlcG9ydGVyLmxvZyhgYClcbiAgICAgICAgICBoZWxwZXJzLnJlcG9ydGVyLndhcm4oXG4gICAgICAgICAgICBmb3JtYXRMb2dNZXNzYWdlKFxuICAgICAgICAgICAgICBgXFxuXFxuUmVjZWl2ZWQgYSA0MDQgd2hlbiB0cnlpbmcgdG8gZmV0Y2hcXG4ke2h0bWxJbWdTcmN9XFxuZnJvbSAke1xuICAgICAgICAgICAgICAgIG5vZGUuX190eXBlbmFtZVxuICAgICAgICAgICAgICB9ICMke25vZGUuZGF0YWJhc2VJZH0gXCIke1xuICAgICAgICAgICAgICAgIG5vZGUudGl0bGUgPz8gbm9kZS5pZFxuICAgICAgICAgICAgICB9XCJcXG5cXG5Nb3N0IGxpa2VseSB0aGlzIGltYWdlIHdhcyB1cGxvYWRlZCB0byB0aGlzICR7XG4gICAgICAgICAgICAgICAgbm9kZS5fX3R5cGVuYW1lXG4gICAgICAgICAgICAgIH0gYW5kIHRoZW4gZGVsZXRlZCBmcm9tIHRoZSBtZWRpYSBsaWJyYXJ5LlxcbllvdSdsbCBuZWVkIHRvIGZpeCB0aGlzIGFuZCByZS1zYXZlIHRoaXMgJHtcbiAgICAgICAgICAgICAgICBub2RlLl9fdHlwZW5hbWVcbiAgICAgICAgICAgICAgfSB0byByZW1vdmUgdGhpcyB3YXJuaW5nIGF0XFxuJHtub2RlRWRpdExpbmt9LlxcblxcbmBcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICAgaW1hZ2VOb2RlID0gbnVsbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhlbHBlcnMucmVwb3J0ZXIucGFuaWMoZm9ybWF0TG9nTWVzc2FnZShlKSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbWFnZU5vZGUpIHtcbiAgICAgIC8vIG1hdGNoIGlzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgaW1nIHRhZ1xuICAgICAgaHRtbE1hdGNoZXNUb01lZGlhSXRlbU5vZGVzTWFwLnNldChtYXRjaCwgeyBpbWFnZU5vZGUsIGNoZWVyaW9JbWcgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaHRtbE1hdGNoZXNUb01lZGlhSXRlbU5vZGVzTWFwXG59XG5cbmNvbnN0IGdldENoZWVyaW9JbWdGcm9tTWF0Y2ggPSAoeyBtYXRjaCB9KSA9PiB7XG4gIC8vIHVuZXNjYXBlIHF1b3Rlc1xuICBjb25zdCBwYXJzZWRNYXRjaCA9IEpTT04ucGFyc2UoYFwiJHttYXRjaH1cImApXG5cbiAgLy8gbG9hZCBvdXIgbWF0Y2hpbmcgaW1nIHRhZyBpbnRvIGNoZWVyaW9cbiAgY29uc3QgJCA9IGNoZWVyaW8ubG9hZChwYXJzZWRNYXRjaCwge1xuICAgIHhtbDoge1xuICAgICAgLy8gbWFrZSBzdXJlIGl0J3Mgbm90IHdyYXBwZWQgaW4gPGJvZHk+PC9ib2R5PlxuICAgICAgd2l0aERvbUx2bDE6IGZhbHNlLFxuICAgICAgLy8gbm8gbmVlZCB0byBub3JtYWxpemUgd2hpdGVzcGFjZSwgd2UncmUgZGVhbGluZyB3aXRoIGEgc2luZ2xlIGVsZW1lbnQgaGVyZVxuICAgICAgbm9ybWFsaXplV2hpdGVzcGFjZTogZmFsc2UsXG4gICAgICB4bWxNb2RlOiB0cnVlLFxuICAgICAgLy8gZW50aXR5IGRlY29kaW5nIGlzbid0IG91ciBqb2IgaGVyZSwgdGhhdCB3aWxsIGJlIHRoZSByZXNwb25zaWJpbGl0eSBvZiBXUEdRTFxuICAgICAgLy8gb3Igb2YgdGhlIHNvdXJjZSBwbHVnaW4gZWxzZXdoZXJlLlxuICAgICAgZGVjb2RlRW50aXRpZXM6IGZhbHNlLFxuICAgIH0sXG4gIH0pXG5cbiAgLy8gdGhlcmUncyBvbmx5IGV2ZXIgb25lIGltYWdlIGR1ZSB0byBvdXIgbWF0Y2ggbWF0Y2hpbmcgYSBzaW5nbGUgaW1nIHRhZ1xuICAvLyAkKGBpbWdgKSBpc24ndCBhbiBhcnJheSwgaXQncyBhbiBvYmplY3Qgd2l0aCBhIGtleSBvZiAwXG4gIGNvbnN0IGNoZWVyaW9JbWcgPSAkKGBpbWdgKVswXVxuXG4gIHJldHVybiB7XG4gICAgbWF0Y2gsXG4gICAgY2hlZXJpb0ltZyxcbiAgfVxufVxuXG5jb25zdCBnZXRMYXJnZXN0U2l6ZUZyb21TaXplc0F0dHJpYnV0ZSA9IChzaXplc1N0cmluZykgPT4ge1xuICBjb25zdCBzaXplc1N0cmluZ3NBcnJheSA9IHNpemVzU3RyaW5nLnNwbGl0KGAsYClcblxuICByZXR1cm4gc2l6ZXNTdHJpbmdzQXJyYXkucmVkdWNlKChsYXJnZXN0LCBjdXJyZW50U2l6ZVN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1heFdpZHRoID0gY3VycmVudFNpemVTdHJpbmdcbiAgICAgIC5zdWJzdHJpbmcoXG4gICAgICAgIGN1cnJlbnRTaXplU3RyaW5nLmluZGV4T2YoYG1heC13aWR0aDogYCkgKyAxLFxuICAgICAgICBjdXJyZW50U2l6ZVN0cmluZy5pbmRleE9mKGBweGApXG4gICAgICApXG4gICAgICAudHJpbSgpXG5cbiAgICBjb25zdCBtYXhXaWR0aE51bWJlciA9IE51bWJlcihtYXhXaWR0aClcbiAgICBjb25zdCBub0xhcmdlc3RBbmRNYXhXaWR0aElzQU51bWJlciA9ICFsYXJnZXN0ICYmICFpc05hTihtYXhXaWR0aE51bWJlcilcbiAgICBjb25zdCBtYXhXaWR0aElzQUxhcmdlck51bWJlclRoYW5MYXJnZXN0ID1cbiAgICAgIGxhcmdlc3QgJiYgIWlzTmFOKG1heFdpZHRoTnVtYmVyKSAmJiBtYXhXaWR0aE51bWJlciA+IGxhcmdlc3RcblxuICAgIGlmIChub0xhcmdlc3RBbmRNYXhXaWR0aElzQU51bWJlciB8fCBtYXhXaWR0aElzQUxhcmdlck51bWJlclRoYW5MYXJnZXN0KSB7XG4gICAgICBsYXJnZXN0ID0gbWF4V2lkdGhOdW1iZXJcbiAgICB9XG5cbiAgICByZXR1cm4gbGFyZ2VzdFxuICB9LCBudWxsKVxufVxuXG5jb25zdCBmaW5kSW1nVGFnTWF4V2lkdGhGcm9tQ2hlZXJpb0ltZyA9IChjaGVlcmlvSW1nKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBhdHRyaWJzOiB7IHdpZHRoLCBzaXplcyB9LFxuICB9ID0gY2hlZXJpb0ltZyB8fCB7IGF0dHJpYnM6IHsgd2lkdGg6IG51bGwsIHNpemVzOiBudWxsIH0gfVxuXG4gIGlmICh3aWR0aCkge1xuICAgIGNvbnN0IHdpZHRoTnVtYmVyID0gTnVtYmVyKHdpZHRoKVxuXG4gICAgaWYgKCFpc05hTih3aWR0aE51bWJlcikpIHtcbiAgICAgIHJldHVybiB3aWR0aFxuICAgIH1cbiAgfVxuXG4gIGlmIChzaXplcykge1xuICAgIGNvbnN0IGxhcmdlc3RTaXplID0gZ2V0TGFyZ2VzdFNpemVGcm9tU2l6ZXNBdHRyaWJ1dGUoc2l6ZXMpXG5cbiAgICBpZiAobGFyZ2VzdFNpemUgJiYgIWlzTmFOKGxhcmdlc3RTaXplKSkge1xuICAgICAgcmV0dXJuIGxhcmdlc3RTaXplXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cblxuY29uc3QgcmVwbGFjZU5vZGVIdG1sSW1hZ2VzID0gYXN5bmMgKHtcbiAgbm9kZVN0cmluZyxcbiAgbm9kZSxcbiAgaGVscGVycyxcbiAgd3BVcmwsXG4gIHBsdWdpbk9wdGlvbnMsXG59KSA9PiB7XG4gIC8vIHRoaXMgcHJldmVudHMgZmV0Y2hpbmcgaW5saW5lIGh0bWwgaW1hZ2VzXG4gIGlmICghcGx1Z2luT3B0aW9ucz8uaHRtbD8udXNlR2F0c2J5SW1hZ2UpIHtcbiAgICByZXR1cm4gbm9kZVN0cmluZ1xuICB9XG5cbiAgY29uc3QgaW1hZ2VVcmxNYXRjaGVzID0gZXhlY2FsbChpbWdTcmNSZW1vdGVGaWxlUmVnZXgsIG5vZGVTdHJpbmcpXG5cbiAgY29uc3QgaW1nVGFnTWF0Y2hlcyA9IGV4ZWNhbGwoaW1nVGFnUmVnZXgsIG5vZGVTdHJpbmcpLmZpbHRlcigoeyBtYXRjaCB9KSA9PiB7XG4gICAgLy8gQHRvZG8gbWFrZSBpdCBhIHBsdWdpbiBvcHRpb24gdG8gZmV0Y2ggbm9uLXdwIGltYWdlc1xuICAgIC8vIGhlcmUgd2UncmUgZmlsdGVyaW5nIG91dCBpbWFnZSB0YWdzIHRoYXQgZG9uJ3QgY29udGFpbiBvdXIgc2l0ZSB1cmxcbiAgICBjb25zdCBpc0hvc3RlZEluV3AgPSBtYXRjaC5pbmNsdWRlcyh3cFVybClcblxuICAgIHJldHVybiBpc0hvc3RlZEluV3BcbiAgfSlcblxuICBpZiAoaW1hZ2VVcmxNYXRjaGVzLmxlbmd0aCkge1xuICAgIGNvbnN0IGNoZWVyaW9JbWFnZXMgPSBpbWdUYWdNYXRjaGVzLm1hcChnZXRDaGVlcmlvSW1nRnJvbU1hdGNoKVxuXG4gICAgY29uc3QgaHRtbE1hdGNoZXNUb01lZGlhSXRlbU5vZGVzTWFwID0gYXdhaXQgZmV0Y2hOb2RlSHRtbEltYWdlTWVkaWFJdGVtTm9kZXMoXG4gICAgICB7XG4gICAgICAgIGNoZWVyaW9JbWFnZXMsXG4gICAgICAgIG5vZGVTdHJpbmcsXG4gICAgICAgIG5vZGUsXG4gICAgICAgIGhlbHBlcnMsXG4gICAgICB9XG4gICAgKVxuXG4gICAgLy8gZ2VuZXJhdGUgZ2F0c2J5IGltYWdlcyBmb3IgZWFjaCBjaGVlcmlvSW1hZ2VcbiAgICBjb25zdCBodG1sTWF0Y2hlc1dpdGhJbWFnZVJlc2l6ZXMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIGltZ1RhZ01hdGNoZXMubWFwKGFzeW5jICh7IG1hdGNoIH0pID0+IHtcbiAgICAgICAgY29uc3QgbWF0Y2hJbmZvID0gaHRtbE1hdGNoZXNUb01lZGlhSXRlbU5vZGVzTWFwLmdldChtYXRjaClcblxuICAgICAgICBpZiAoIW1hdGNoSW5mbykge1xuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGltYWdlTm9kZSwgY2hlZXJpb0ltZyB9ID0gbWF0Y2hJbmZvXG5cbiAgICAgICAgY29uc3QgaXNNZWRpYUl0ZW1Ob2RlID0gaW1hZ2VOb2RlLl9fdHlwZW5hbWUgPT09IGBNZWRpYUl0ZW1gXG5cbiAgICAgICAgaWYgKCFpbWFnZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsZU5vZGUgPVxuICAgICAgICAgIC8vIGlmIHdlIGNvdWxkbid0IGdldCBhIE1lZGlhSXRlbSBub2RlIGZvciB0aGlzIGltYWdlIGluIFdQR1FMXG4gICAgICAgICAgIWlzTWVkaWFJdGVtTm9kZVxuICAgICAgICAgICAgPyAvLyB0aGlzIHdpbGwgYWxyZWFkeSBiZSBhIGZpbGUgbm9kZVxuICAgICAgICAgICAgICBpbWFnZU5vZGVcbiAgICAgICAgICAgIDogLy8gb3RoZXJ3aXNlIGdyYWIgdGhlIGZpbGUgbm9kZVxuICAgICAgICAgICAgICBoZWxwZXJzLmdldE5vZGUoaW1hZ2VOb2RlLmxvY2FsRmlsZS5pZClcblxuICAgICAgICBjb25zdCBpbWdUYWdNYXhXaWR0aCA9IGZpbmRJbWdUYWdNYXhXaWR0aEZyb21DaGVlcmlvSW1nKGNoZWVyaW9JbWcpXG5cbiAgICAgICAgY29uc3QgbWVkaWFJdGVtTm9kZVdpZHRoID0gaXNNZWRpYUl0ZW1Ob2RlXG4gICAgICAgICAgPyBpbWFnZU5vZGU/Lm1lZGlhRGV0YWlscz8ud2lkdGhcbiAgICAgICAgICA6IG51bGxcblxuICAgICAgICAvLyBpZiBhIG1heCB3aWR0aCBjYW4ndCBiZSBpbmZlcnJlZCBmcm9tIGh0bWwsIHRoaXMgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdG8gU2hhcnBcbiAgICAgICAgbGV0IGZhbGxiYWNrSW1hZ2VNYXhXaWR0aCA9IHBsdWdpbk9wdGlvbnM/Lmh0bWw/LmZhbGxiYWNrSW1hZ2VNYXhXaWR0aFxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAvLyBpZiB0aGUgaW1hZ2UgaXMgc21hbGxlciB0aGFuIHRoZSBmYWxsYmFjayBtYXggd2lkdGgsXG4gICAgICAgICAgLy8gdGhlIGltYWdlcyB3aWR0aCB3aWxsIGJlIHVzZWQgaW5zdGVhZCBpZiB3ZSBoYXZlIGEgbWVkaWEgaXRlbSBub2RlXG4gICAgICAgICAgZmFsbGJhY2tJbWFnZU1heFdpZHRoID4gbWVkaWFJdGVtTm9kZVdpZHRoICYmXG4gICAgICAgICAgLy8gb2YgY291cnNlIHRoYXQgbWVhbnMgd2UgaGF2ZSB0byBoYXZlIGEgbWVkaWEgaXRlbSBub2RlXG4gICAgICAgICAgLy8gYW5kIGEgbWVkaWEgaXRlbSBub2RlIG1heCB3aWR0aFxuICAgICAgICAgIG1lZGlhSXRlbU5vZGVXaWR0aCAmJlxuICAgICAgICAgIHR5cGVvZiBtZWRpYUl0ZW1Ob2RlV2lkdGggPT09IGBudW1iZXJgICYmXG4gICAgICAgICAgbWVkaWFJdGVtTm9kZVdpZHRoID4gMFxuICAgICAgICApIHtcbiAgICAgICAgICBmYWxsYmFja0ltYWdlTWF4V2lkdGggPSBtZWRpYUl0ZW1Ob2RlV2lkdGhcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heFdpZHRoID1cbiAgICAgICAgICAvLyBpZiB3ZSBpbmZlcnJlZCBhIG1heHdpZHRoIGZyb20gaHRtbFxuICAgICAgICAgIChpbWdUYWdNYXhXaWR0aCAmJlxuICAgICAgICAgIC8vIGFuZCB3ZSBoYXZlIGEgbWVkaWEgaXRlbSBub2RlIHRvIGtub3cgaXQncyBmdWxsIHNpemUgbWF4IHdpZHRoXG4gICAgICAgICAgbWVkaWFJdGVtTm9kZVdpZHRoICYmXG4gICAgICAgICAgLy8gYW5kIHRoZSBtZWRpYSBpdGVtIG5vZGUgbWF4IHdpZHRoIGlzIHNtYWxsZXIgdGhhbiB3aGF0IHdlIGluZmVycmVkXG4gICAgICAgICAgLy8gZnJvbSBodG1sXG4gICAgICAgICAgbWVkaWFJdGVtTm9kZVdpZHRoIDwgaW1nVGFnTWF4V2lkdGhcbiAgICAgICAgICAgID8gLy8gdXNlIHRoZSBtZWRpYSBpdGVtIG5vZGUgd2lkdGhcbiAgICAgICAgICAgICAgbWVkaWFJdGVtTm9kZVdpZHRoXG4gICAgICAgICAgICA6IC8vIG90aGVyd2lzZSB1c2UgdGhlIHdpZHRoIGluZmVycmVkIGZyb20gaHRtbFxuICAgICAgICAgICAgICBpbWdUYWdNYXhXaWR0aCkgPz9cbiAgICAgICAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgbWVkaWEgaXRlbSBub2RlIGFuZCB3ZSBpbmZlcnJlZCBubyB3aWR0aFxuICAgICAgICAgIC8vIGZyb20gaHRtbCwgdGhlbiB1c2UgdGhlIGZhbGxiYWNrIG1heCB3aWR0aCBmcm9tIHBsdWdpbiBvcHRpb25zXG4gICAgICAgICAgZmFsbGJhY2tJbWFnZU1heFdpZHRoXG5cbiAgICAgICAgY29uc3QgcXVhbGl0eSA9IHBsdWdpbk9wdGlvbnM/Lmh0bWw/LmltYWdlUXVhbGl0eVxuXG4gICAgICAgIGNvbnN0IHsgcmVwb3J0ZXIsIGNhY2hlLCBwYXRoUHJlZml4IH0gPSBoZWxwZXJzXG5cbiAgICAgICAgbGV0IGZsdWlkUmVzdWx0XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmbHVpZFJlc3VsdCA9IGF3YWl0IGZsdWlkKHtcbiAgICAgICAgICAgIGZpbGU6IGZpbGVOb2RlLFxuICAgICAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgICBtYXhXaWR0aCxcbiAgICAgICAgICAgICAgcXVhbGl0eSxcbiAgICAgICAgICAgICAgcGF0aFByZWZpeCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXBvcnRlcixcbiAgICAgICAgICAgIGNhY2hlLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZXBvcnRlci5lcnJvcihlKVxuICAgICAgICAgIHJlcG9ydGVyLndhcm4oXG4gICAgICAgICAgICBmb3JtYXRMb2dNZXNzYWdlKFxuICAgICAgICAgICAgICBgJHtub2RlLl9fdHlwZW5hbWV9ICR7bm9kZS5pZH0gY291bGRuJ3QgcHJvY2VzcyBpbmxpbmUgaHRtbCBpbWFnZSAke2ZpbGVOb2RlLnVybH1gXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgIGNoZWVyaW9JbWcsXG4gICAgICAgICAgZmlsZU5vZGUsXG4gICAgICAgICAgaW1hZ2VSZXNpemU6IGZsdWlkUmVzdWx0LFxuICAgICAgICAgIG1heFdpZHRoLFxuICAgICAgICB9XG4gICAgICB9KVxuICAgIClcblxuICAgIC8vIGZpbmQvcmVwbGFjZSBtdXRhdGUgbm9kZVN0cmluZyB0byByZXBsYWNlIG1hdGNoZWQgaW1hZ2VzIHdpdGggcmVuZGVyZWQgZ2F0c2J5IGltYWdlc1xuICAgIGZvciAoY29uc3QgbWF0Y2hSZXNpemUgb2YgaHRtbE1hdGNoZXNXaXRoSW1hZ2VSZXNpemVzKSB7XG4gICAgICBpZiAoIW1hdGNoUmVzaXplKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgbWF0Y2gsIGltYWdlUmVzaXplLCBjaGVlcmlvSW1nLCBtYXhXaWR0aCB9ID0gbWF0Y2hSZXNpemVcblxuICAgICAgLy8gQHRvZG8gcmV0YWluIGltZyB0YWcgY2xhc3NlcyBhbmQgYXR0cmlidXRlcyBmcm9tIGNoZWVyaW9JbWdcbiAgICAgIGNvbnN0IGltZ09wdGlvbnMgPSB7XG4gICAgICAgIGZsdWlkOiBpbWFnZVJlc2l6ZSxcbiAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAvLyB0aGVzZSBzdHlsZXMgbWFrZSBpdCBzbyB0aGF0IHRoZSBpbWFnZSB3b250IGJlIHN0cmV0Y2hlZFxuICAgICAgICAgIC8vIGJleW9uZCBpdCdzIG1heCB3aWR0aCwgYnV0IGl0IGFsc28gd29udCBleGNlZWQgdGhlIHdpZHRoXG4gICAgICAgICAgLy8gb2YgaXQncyBwYXJlbnQgZWxlbWVudFxuICAgICAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICAgICAgICB3aWR0aDogYCR7bWF4V2lkdGh9cHhgLFxuICAgICAgICB9LFxuICAgICAgICBjbGFzc05hbWU6IGNoZWVyaW9JbWc/LmF0dHJpYnM/LmNsYXNzLFxuICAgICAgICAvLyBGb3JjZSBzaG93IGZ1bGwgaW1hZ2UgaW5zdGFudGx5XG4gICAgICAgIGxvYWRpbmc6IFwiZWFnZXJcIixcbiAgICAgICAgYWx0OiBjaGVlcmlvSW1nPy5hdHRyaWJzPy5hbHQsXG4gICAgICAgIGZhZGVJbjogdHJ1ZSxcbiAgICAgICAgaW1nU3R5bGU6IHtcbiAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICB9LFxuICAgICAgfVxuXG4gICAgICBjb25zdCBSZWFjdEdhdHNieUltYWdlID0gUmVhY3QuY3JlYXRlRWxlbWVudChJbWcsIGltZ09wdGlvbnMsIG51bGwpXG4gICAgICBjb25zdCBnYXRzYnlJbWFnZVN0cmluZ0pTT04gPSBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgUmVhY3RET01TZXJ2ZXIucmVuZGVyVG9TdHJpbmcoUmVhY3RHYXRzYnlJbWFnZSlcbiAgICAgIClcblxuICAgICAgLy8gbmVlZCB0byByZW1vdmUgdGhlIEpTT04gc3RyaW5naWZ5IHF1b3RlcyBhcm91bmQgb3VyIGltYWdlIHNpbmNlIHdlJ3JlXG4gICAgICAvLyB0aHJlYWRpbmcgdGhpcyBKU09OIHN0cmluZyBiYWNrIGludG8gYSBsYXJnZXIgSlNPTiBvYmplY3Qgc3RyaW5nXG4gICAgICBjb25zdCBnYXRzYnlJbWFnZVN0cmluZyA9IGdhdHNieUltYWdlU3RyaW5nSlNPTi5zdWJzdHJpbmcoXG4gICAgICAgIDEsXG4gICAgICAgIGdhdHNieUltYWdlU3RyaW5nSlNPTi5sZW5ndGggLSAxXG4gICAgICApXG5cbiAgICAgIC8vIHJlcGxhY2UgbWF0Y2ggd2l0aCByZWFjdCBzdHJpbmcgaW4gbm9kZVN0cmluZ1xuICAgICAgbm9kZVN0cmluZyA9IG5vZGVTdHJpbmcucmVwbGFjZShtYXRjaCwgZ2F0c2J5SW1hZ2VTdHJpbmcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGVTdHJpbmdcbn1cblxuLy8gcmVwbGFjZXMgYW55IHVybCB3aGljaCBpcyBhIGZyb250LWVuZCBXUCB1cmwgd2l0aCBhIHJlbGF0aXZlIHBhdGhcbmNvbnN0IHJlcGxhY2VOb2RlSHRtbExpbmtzID0gKHsgd3BVcmwsIG5vZGVTdHJpbmcsIG5vZGUgfSkgPT4ge1xuICBjb25zdCB3cExpbmtSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgYFtcIiddJHt3cFVybH0oPyEvd3AtY29udGVudHwvd3AtYWRtaW58L3dwLWluY2x1ZGVzKSgvW14nXCJdKylbXCInXWAsXG4gICAgYGdpbWBcbiAgKVxuXG4gIGNvbnN0IGxpbmtNYXRjaGVzID0gZXhlY2FsbCh3cExpbmtSZWdleCwgbm9kZVN0cmluZylcblxuICBpZiAobGlua01hdGNoZXMubGVuZ3RoKSB7XG4gICAgbGlua01hdGNoZXMuZm9yRWFjaCgoeyBtYXRjaCwgc3ViTWF0Y2hlczogW3BhdGhdIH0pID0+IHtcbiAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gcmVtb3ZlIFxcLCBcIiBhbmQgJyBjaGFyYWN0ZXJzIGZyb20gbWF0Y2hcbiAgICAgICAgICBjb25zdCBub3JtYWxpemVkTWF0Y2ggPSBtYXRjaC5yZXBsYWNlKC9bJ1wiXFxcXF0vZywgYGApXG5cbiAgICAgICAgICBjb25zdCBub3JtYWxpemVkUGF0aCA9IHBhdGgucmVwbGFjZSgvXFxcXC9nLCBgYClcblxuICAgICAgICAgIC8vIHJlcGxhY2Ugbm9ybWFsaXplZCBtYXRjaCB3aXRoIHJlbGF0aXZlIHBhdGhcbiAgICAgICAgICBjb25zdCB0aGlzTWF0Y2hSZWdleCA9IG5ldyBSZWdFeHAobm9ybWFsaXplZE1hdGNoLCBgZ2ApXG4gICAgICAgICAgbm9kZVN0cmluZyA9IG5vZGVTdHJpbmcucmVwbGFjZSh0aGlzTWF0Y2hSZWdleCwgbm9ybWFsaXplZFBhdGgpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgICAgY29uc29sZS53YXJuaW5nKFxuICAgICAgICAgICAgZm9ybWF0TG9nTWVzc2FnZShcbiAgICAgICAgICAgICAgYEZhaWxlZCB0byBwcm9jZXNzIGlubGluZSBodG1sIGxpbmtzIGluICR7bm9kZS5fX3R5cGVuYW1lfSAke25vZGUuaWR9YFxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICByZXR1cm4gbm9kZVN0cmluZ1xufVxuXG5jb25zdCBwcm9jZXNzTm9kZVN0cmluZyA9IGFzeW5jICh7XG4gIG5vZGVTdHJpbmcsXG4gIG5vZGUsXG4gIHBsdWdpbk9wdGlvbnMsXG4gIGhlbHBlcnMsXG4gIHdwVXJsLFxufSkgPT4ge1xuICBjb25zdCBub2RlU3RyaW5nRmlsdGVycyA9IFtyZXBsYWNlTm9kZUh0bWxJbWFnZXMsIHJlcGxhY2VOb2RlSHRtbExpbmtzXVxuXG4gIGZvciAoY29uc3Qgbm9kZVN0cmluZ0ZpbHRlciBvZiBub2RlU3RyaW5nRmlsdGVycykge1xuICAgIG5vZGVTdHJpbmcgPSBhd2FpdCBub2RlU3RyaW5nRmlsdGVyKHtcbiAgICAgIG5vZGVTdHJpbmcsXG4gICAgICBub2RlLFxuICAgICAgcGx1Z2luT3B0aW9ucyxcbiAgICAgIGhlbHBlcnMsXG4gICAgICB3cFVybCxcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIG5vZGVTdHJpbmdcbn1cblxuY29uc3QgcHJvY2Vzc05vZGUgPSBhc3luYyAoe1xuICBub2RlLFxuICBwbHVnaW5PcHRpb25zLFxuICB3cFVybCxcbiAgaGVscGVycyxcbiAgcmVmZXJlbmNlZE1lZGlhSXRlbU5vZGVJZHMsXG59KSA9PiB7XG4gIGNvbnN0IG5vZGVTdHJpbmcgPSBzdHJpbmdpZnkobm9kZSlcblxuICAvLyBmaW5kIHJlZmVyZW5jZWQgbm9kZSBpZHNcbiAgLy8gaGVyZSB3ZSdyZSBzZWFyY2hpbmcgZm9yIG5vZGUgaWQgc3RyaW5ncyBpbiBvdXIgbm9kZVxuICAvLyB3ZSB1c2UgdGhpcyB0byBkb3dubG9hZCBvbmx5IHRoZSBtZWRpYSBpdGVtc1xuICAvLyB0aGF0IGFyZSBiZWluZyB1c2VkIGluIHBvc3RzXG4gIC8vIHRoaXMgaXMgaW1wb3J0YW50IGZvciBkb3dubG9hZGluZyBpbWFnZXMgbm9kZXMgdGhhdCBhcmUgY29ubmVjdGVkIHNvbWV3aGVyZVxuICAvLyBvbiBhIG5vZGUgZmllbGRcbiAgY29uc3Qgbm9kZU1lZGlhSXRlbUlkUmVmZXJlbmNlcyA9IGZpbmRSZWZlcmVuY2VkSW1hZ2VOb2RlSWRzKHtcbiAgICBub2RlU3RyaW5nLFxuICAgIHBsdWdpbk9wdGlvbnMsXG4gICAgbm9kZSxcbiAgfSlcblxuICAvLyBwdXNoIHRoZW0gdG8gb3VyIHN0b3JlIG9mIHJlZmVyZW5jZWQgaWQnc1xuICBpZiAobm9kZU1lZGlhSXRlbUlkUmVmZXJlbmNlcz8ubGVuZ3RoICYmIHJlZmVyZW5jZWRNZWRpYUl0ZW1Ob2RlSWRzKSB7XG4gICAgbm9kZU1lZGlhSXRlbUlkUmVmZXJlbmNlcy5mb3JFYWNoKChpZCkgPT5cbiAgICAgIHJlZmVyZW5jZWRNZWRpYUl0ZW1Ob2RlSWRzLmFkZChpZClcbiAgICApXG4gIH1cblxuICBjb25zdCBwcm9jZXNzZWROb2RlU3RyaW5nID0gYXdhaXQgcHJvY2Vzc05vZGVTdHJpbmcoe1xuICAgIG5vZGVTdHJpbmcsXG4gICAgbm9kZSxcbiAgICBwbHVnaW5PcHRpb25zLFxuICAgIGhlbHBlcnMsXG4gICAgd3BVcmwsXG4gIH0pXG5cbiAgLy8gb25seSBwYXJzZSBpZiB0aGUgbm9kZVN0cmluZyBoYXMgY2hhbmdlZFxuICBpZiAocHJvY2Vzc2VkTm9kZVN0cmluZyAhPT0gbm9kZVN0cmluZykge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHByb2Nlc3NlZE5vZGVTdHJpbmcpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5vZGVcbiAgfVxufVxuXG5leHBvcnQgeyBwcm9jZXNzTm9kZSB9XG4iXX0=