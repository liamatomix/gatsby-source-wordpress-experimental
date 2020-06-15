"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

require("source-map-support/register");

var _remoteSchema = _interopRequireDefault(require("./remoteSchema"));

var _gatsbyApi = _interopRequireDefault(require("./gatsby-api"));

var _logger = _interopRequireDefault(require("./logger"));

var _imageNodes = _interopRequireDefault(require("./image-nodes"));

var _default = {
  remoteSchema: _remoteSchema.default,
  gatsbyApi: _gatsbyApi.default,
  logger: _logger.default,
  imageNodes: _imageNodes.default
};
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvaW5kZXguanMiXSwibmFtZXMiOlsicmVtb3RlU2NoZW1hIiwiZ2F0c2J5QXBpIiwibG9nZ2VyIiwiaW1hZ2VOb2RlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O2VBRWU7QUFDYkEsRUFBQUEsWUFBWSxFQUFaQSxxQkFEYTtBQUViQyxFQUFBQSxTQUFTLEVBQVRBLGtCQUZhO0FBR2JDLEVBQUFBLE1BQU0sRUFBTkEsZUFIYTtBQUliQyxFQUFBQSxVQUFVLEVBQVZBO0FBSmEsQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZW1vdGVTY2hlbWEgZnJvbSBcIi4vcmVtb3RlU2NoZW1hXCJcbmltcG9ydCBnYXRzYnlBcGkgZnJvbSBcIi4vZ2F0c2J5LWFwaVwiXG5pbXBvcnQgbG9nZ2VyIGZyb20gXCIuL2xvZ2dlclwiXG5pbXBvcnQgaW1hZ2VOb2RlcyBmcm9tIFwiLi9pbWFnZS1ub2Rlc1wiXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgcmVtb3RlU2NoZW1hLFxuICBnYXRzYnlBcGksXG4gIGxvZ2dlcixcbiAgaW1hZ2VOb2Rlcyxcbn1cbiJdfQ==