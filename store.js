"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

require("source-map-support/register");

var _core = require("@rematch/core");

var _immer = _interopRequireDefault(require("@rematch/immer"));

var _models = _interopRequireDefault(require("./models"));

const store = (0, _core.init)({
  models: _models.default,
  plugins: [(0, _immer.default)()]
});
var _default = store;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zdG9yZS5qcyJdLCJuYW1lcyI6WyJzdG9yZSIsIm1vZGVscyIsInBsdWdpbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLEtBQUssR0FBRyxnQkFBSztBQUNqQkMsRUFBQUEsTUFBTSxFQUFOQSxlQURpQjtBQUVqQkMsRUFBQUEsT0FBTyxFQUFFLENBQUMscUJBQUQ7QUFGUSxDQUFMLENBQWQ7ZUFLZUYsSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGluaXQgfSBmcm9tIFwiQHJlbWF0Y2gvY29yZVwiXG5pbXBvcnQgaW1tZXJQbHVnaW4gZnJvbSBcIkByZW1hdGNoL2ltbWVyXCJcbmltcG9ydCBtb2RlbHMgZnJvbSBcIi4vbW9kZWxzXCJcblxuY29uc3Qgc3RvcmUgPSBpbml0KHtcbiAgbW9kZWxzLFxuICBwbHVnaW5zOiBbaW1tZXJQbHVnaW4oKV0sXG59KVxuXG5leHBvcnQgZGVmYXVsdCBzdG9yZVxuIl19