"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.processAndValidatePluginOptions = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../store"));

var _formatLogMessage = require("../utils/format-log-message");

var _isInteger = _interopRequireDefault(require("lodash/isInteger"));

const optionsProcessors = [{
  name: `excludeFields-renamed-to-excludeFieldNames`,
  test: ({
    userPluginOptions
  }) => {
    var _userPluginOptions$ex, _userPluginOptions$ex2;

    return (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ex = userPluginOptions.excludeFields) === null || _userPluginOptions$ex === void 0 ? void 0 : _userPluginOptions$ex.length) || (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ex2 = userPluginOptions.excludeFieldNames) === null || _userPluginOptions$ex2 === void 0 ? void 0 : _userPluginOptions$ex2.length);
  },
  processor: ({
    helpers,
    userPluginOptions
  }) => {
    var _userPluginOptions$ex3;

    if (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ex3 = userPluginOptions.excludeFields) === null || _userPluginOptions$ex3 === void 0 ? void 0 : _userPluginOptions$ex3.length) {
      helpers.reporter.log(``);
      helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)( // @todo
      `\n\nPlugin options excludeFields has been renamed to excludeFieldNames.\nBoth options work for now, but excludeFields will be removed in a future version\n(likely when we get to beta) in favour of excludeFieldNames.\n\n`));
    }

    _store.default.dispatch.remoteSchema.addFieldsToBlackList(userPluginOptions.excludeFieldNames || userPluginOptions.excludeFields);

    return userPluginOptions;
  }
}, {
  name: `queryDepth-is-not-a-positive-int`,
  test: ({
    userPluginOptions
  }) => {
    var _userPluginOptions$sc, _userPluginOptions$sc2, _userPluginOptions$sc3;

    return typeof (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$sc = userPluginOptions.schema) === null || _userPluginOptions$sc === void 0 ? void 0 : _userPluginOptions$sc.queryDepth) !== `undefined` && (!(0, _isInteger.default)(userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$sc2 = userPluginOptions.schema) === null || _userPluginOptions$sc2 === void 0 ? void 0 : _userPluginOptions$sc2.queryDepth) || (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$sc3 = userPluginOptions.schema) === null || _userPluginOptions$sc3 === void 0 ? void 0 : _userPluginOptions$sc3.queryDepth) <= 0);
  },
  processor: ({
    helpers,
    userPluginOptions
  }) => {
    helpers.reporter.log(``);
    helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`\n\npluginOptions.schema.queryDepth is not a positive integer.\nUsing default value in place of provided value.\n`, {
      useVerboseStyle: true
    }));
    delete userPluginOptions.schema.queryDepth;
    return userPluginOptions;
  }
}];

const processAndValidatePluginOptions = (helpers, pluginOptions) => {
  let userPluginOptions = Object.assign({}, pluginOptions);
  optionsProcessors.forEach(({
    test,
    processor,
    name
  }) => {
    if (!name) {
      helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`Plugin option filter is unnamed\n\n${test.toString()}\n\n${processor.toString()}`));
    }

    if (test({
      helpers,
      userPluginOptions
    })) {
      const filteredUserPluginOptions = processor({
        helpers,
        userPluginOptions
      });

      if (filteredUserPluginOptions) {
        userPluginOptions = filteredUserPluginOptions;
      } else {
        helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`Plugin option filter ${name} didn't return a filtered options object`));
      }
    }
  });
  return userPluginOptions;
};

exports.processAndValidatePluginOptions = processAndValidatePluginOptions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdGVwcy9wcm9jZXNzLWFuZC12YWxpZGF0ZS1wbHVnaW4tb3B0aW9ucy5qcyJdLCJuYW1lcyI6WyJvcHRpb25zUHJvY2Vzc29ycyIsIm5hbWUiLCJ0ZXN0IiwidXNlclBsdWdpbk9wdGlvbnMiLCJleGNsdWRlRmllbGRzIiwibGVuZ3RoIiwiZXhjbHVkZUZpZWxkTmFtZXMiLCJwcm9jZXNzb3IiLCJoZWxwZXJzIiwicmVwb3J0ZXIiLCJsb2ciLCJ3YXJuIiwic3RvcmUiLCJkaXNwYXRjaCIsInJlbW90ZVNjaGVtYSIsImFkZEZpZWxkc1RvQmxhY2tMaXN0Iiwic2NoZW1hIiwicXVlcnlEZXB0aCIsInVzZVZlcmJvc2VTdHlsZSIsInByb2Nlc3NBbmRWYWxpZGF0ZVBsdWdpbk9wdGlvbnMiLCJwbHVnaW5PcHRpb25zIiwiZm9yRWFjaCIsInBhbmljIiwidG9TdHJpbmciLCJmaWx0ZXJlZFVzZXJQbHVnaW5PcHRpb25zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxpQkFBaUIsR0FBRyxDQUN4QjtBQUNFQyxFQUFBQSxJQUFJLEVBQUcsNENBRFQ7QUFFRUMsRUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBRUMsSUFBQUE7QUFBRixHQUFEO0FBQUE7O0FBQUEsV0FDSixDQUFBQSxpQkFBaUIsU0FBakIsSUFBQUEsaUJBQWlCLFdBQWpCLHFDQUFBQSxpQkFBaUIsQ0FBRUMsYUFBbkIsZ0ZBQWtDQyxNQUFsQyxNQUNBRixpQkFEQSxhQUNBQSxpQkFEQSxpREFDQUEsaUJBQWlCLENBQUVHLGlCQURuQiwyREFDQSx1QkFBc0NELE1BRHRDLENBREk7QUFBQSxHQUZSO0FBS0VFLEVBQUFBLFNBQVMsRUFBRSxDQUFDO0FBQUVDLElBQUFBLE9BQUY7QUFBV0wsSUFBQUE7QUFBWCxHQUFELEtBQW9DO0FBQUE7O0FBQzdDLFFBQUlBLGlCQUFKLGFBQUlBLGlCQUFKLGlEQUFJQSxpQkFBaUIsQ0FBRUMsYUFBdkIsMkRBQUksdUJBQWtDQyxNQUF0QyxFQUE4QztBQUM1Q0csTUFBQUEsT0FBTyxDQUFDQyxRQUFSLENBQWlCQyxHQUFqQixDQUFzQixFQUF0QjtBQUNBRixNQUFBQSxPQUFPLENBQUNDLFFBQVIsQ0FBaUJFLElBQWpCLENBQ0UseUNBQ0U7QUFDQyxtT0FGSCxDQURGO0FBTUQ7O0FBRURDLG1CQUFNQyxRQUFOLENBQWVDLFlBQWYsQ0FBNEJDLG9CQUE1QixDQUNFWixpQkFBaUIsQ0FBQ0csaUJBQWxCLElBQXVDSCxpQkFBaUIsQ0FBQ0MsYUFEM0Q7O0FBSUEsV0FBT0QsaUJBQVA7QUFDRDtBQXJCSCxDQUR3QixFQXdCeEI7QUFDRUYsRUFBQUEsSUFBSSxFQUFHLGtDQURUO0FBRUVDLEVBQUFBLElBQUksRUFBRSxDQUFDO0FBQUVDLElBQUFBO0FBQUYsR0FBRDtBQUFBOztBQUFBLFdBQ0osUUFBT0EsaUJBQVAsYUFBT0EsaUJBQVAsZ0RBQU9BLGlCQUFpQixDQUFFYSxNQUExQiwwREFBTyxzQkFBMkJDLFVBQWxDLE1BQWtELFdBQWxELEtBQ0MsQ0FBQyx3QkFBVWQsaUJBQVYsYUFBVUEsaUJBQVYsaURBQVVBLGlCQUFpQixDQUFFYSxNQUE3QiwyREFBVSx1QkFBMkJDLFVBQXJDLENBQUQsSUFDQyxDQUFBZCxpQkFBaUIsU0FBakIsSUFBQUEsaUJBQWlCLFdBQWpCLHNDQUFBQSxpQkFBaUIsQ0FBRWEsTUFBbkIsa0ZBQTJCQyxVQUEzQixLQUF5QyxDQUYzQyxDQURJO0FBQUEsR0FGUjtBQU1FVixFQUFBQSxTQUFTLEVBQUUsQ0FBQztBQUFFQyxJQUFBQSxPQUFGO0FBQVdMLElBQUFBO0FBQVgsR0FBRCxLQUFvQztBQUM3Q0ssSUFBQUEsT0FBTyxDQUFDQyxRQUFSLENBQWlCQyxHQUFqQixDQUFzQixFQUF0QjtBQUNBRixJQUFBQSxPQUFPLENBQUNDLFFBQVIsQ0FBaUJFLElBQWpCLENBQ0Usd0NBQ0csbUhBREgsRUFFRTtBQUFFTyxNQUFBQSxlQUFlLEVBQUU7QUFBbkIsS0FGRixDQURGO0FBT0EsV0FBT2YsaUJBQWlCLENBQUNhLE1BQWxCLENBQXlCQyxVQUFoQztBQUVBLFdBQU9kLGlCQUFQO0FBQ0Q7QUFsQkgsQ0F4QndCLENBQTFCOztBQThDTyxNQUFNZ0IsK0JBQStCLEdBQUcsQ0FBQ1gsT0FBRCxFQUFVWSxhQUFWLEtBQTRCO0FBQ3pFLE1BQUlqQixpQkFBaUIscUJBQ2hCaUIsYUFEZ0IsQ0FBckI7QUFJQXBCLEVBQUFBLGlCQUFpQixDQUFDcUIsT0FBbEIsQ0FBMEIsQ0FBQztBQUFFbkIsSUFBQUEsSUFBRjtBQUFRSyxJQUFBQSxTQUFSO0FBQW1CTixJQUFBQTtBQUFuQixHQUFELEtBQStCO0FBQ3ZELFFBQUksQ0FBQ0EsSUFBTCxFQUFXO0FBQ1RPLE1BQUFBLE9BQU8sQ0FBQ0MsUUFBUixDQUFpQmEsS0FBakIsQ0FDRSx3Q0FDRyxzQ0FBcUNwQixJQUFJLENBQUNxQixRQUFMLEVBQWdCLE9BQU1oQixTQUFTLENBQUNnQixRQUFWLEVBQXFCLEVBRG5GLENBREY7QUFLRDs7QUFFRCxRQUFJckIsSUFBSSxDQUFDO0FBQUVNLE1BQUFBLE9BQUY7QUFBV0wsTUFBQUE7QUFBWCxLQUFELENBQVIsRUFBMEM7QUFDeEMsWUFBTXFCLHlCQUF5QixHQUFHakIsU0FBUyxDQUFDO0FBQzFDQyxRQUFBQSxPQUQwQztBQUUxQ0wsUUFBQUE7QUFGMEMsT0FBRCxDQUEzQzs7QUFLQSxVQUFJcUIseUJBQUosRUFBK0I7QUFDN0JyQixRQUFBQSxpQkFBaUIsR0FBR3FCLHlCQUFwQjtBQUNELE9BRkQsTUFFTztBQUNMaEIsUUFBQUEsT0FBTyxDQUFDQyxRQUFSLENBQWlCYSxLQUFqQixDQUNFLHdDQUNHLHdCQUF1QnJCLElBQUssMENBRC9CLENBREY7QUFLRDtBQUNGO0FBQ0YsR0F6QkQ7QUEyQkEsU0FBT0UsaUJBQVA7QUFDRCxDQWpDTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5pbXBvcnQgeyBmb3JtYXRMb2dNZXNzYWdlIH0gZnJvbSBcIn4vdXRpbHMvZm9ybWF0LWxvZy1tZXNzYWdlXCJcbmltcG9ydCBpc0ludGVnZXIgZnJvbSBcImxvZGFzaC9pc0ludGVnZXJcIlxuXG5jb25zdCBvcHRpb25zUHJvY2Vzc29ycyA9IFtcbiAge1xuICAgIG5hbWU6IGBleGNsdWRlRmllbGRzLXJlbmFtZWQtdG8tZXhjbHVkZUZpZWxkTmFtZXNgLFxuICAgIHRlc3Q6ICh7IHVzZXJQbHVnaW5PcHRpb25zIH0pID0+XG4gICAgICB1c2VyUGx1Z2luT3B0aW9ucz8uZXhjbHVkZUZpZWxkcz8ubGVuZ3RoIHx8XG4gICAgICB1c2VyUGx1Z2luT3B0aW9ucz8uZXhjbHVkZUZpZWxkTmFtZXM/Lmxlbmd0aCxcbiAgICBwcm9jZXNzb3I6ICh7IGhlbHBlcnMsIHVzZXJQbHVnaW5PcHRpb25zIH0pID0+IHtcbiAgICAgIGlmICh1c2VyUGx1Z2luT3B0aW9ucz8uZXhjbHVkZUZpZWxkcz8ubGVuZ3RoKSB7XG4gICAgICAgIGhlbHBlcnMucmVwb3J0ZXIubG9nKGBgKVxuICAgICAgICBoZWxwZXJzLnJlcG9ydGVyLndhcm4oXG4gICAgICAgICAgZm9ybWF0TG9nTWVzc2FnZShcbiAgICAgICAgICAgIC8vIEB0b2RvXG4gICAgICAgICAgICBgXFxuXFxuUGx1Z2luIG9wdGlvbnMgZXhjbHVkZUZpZWxkcyBoYXMgYmVlbiByZW5hbWVkIHRvIGV4Y2x1ZGVGaWVsZE5hbWVzLlxcbkJvdGggb3B0aW9ucyB3b3JrIGZvciBub3csIGJ1dCBleGNsdWRlRmllbGRzIHdpbGwgYmUgcmVtb3ZlZCBpbiBhIGZ1dHVyZSB2ZXJzaW9uXFxuKGxpa2VseSB3aGVuIHdlIGdldCB0byBiZXRhKSBpbiBmYXZvdXIgb2YgZXhjbHVkZUZpZWxkTmFtZXMuXFxuXFxuYFxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuYWRkRmllbGRzVG9CbGFja0xpc3QoXG4gICAgICAgIHVzZXJQbHVnaW5PcHRpb25zLmV4Y2x1ZGVGaWVsZE5hbWVzIHx8IHVzZXJQbHVnaW5PcHRpb25zLmV4Y2x1ZGVGaWVsZHNcbiAgICAgIClcblxuICAgICAgcmV0dXJuIHVzZXJQbHVnaW5PcHRpb25zXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6IGBxdWVyeURlcHRoLWlzLW5vdC1hLXBvc2l0aXZlLWludGAsXG4gICAgdGVzdDogKHsgdXNlclBsdWdpbk9wdGlvbnMgfSkgPT5cbiAgICAgIHR5cGVvZiB1c2VyUGx1Z2luT3B0aW9ucz8uc2NoZW1hPy5xdWVyeURlcHRoICE9PSBgdW5kZWZpbmVkYCAmJlxuICAgICAgKCFpc0ludGVnZXIodXNlclBsdWdpbk9wdGlvbnM/LnNjaGVtYT8ucXVlcnlEZXB0aCkgfHxcbiAgICAgICAgdXNlclBsdWdpbk9wdGlvbnM/LnNjaGVtYT8ucXVlcnlEZXB0aCA8PSAwKSxcbiAgICBwcm9jZXNzb3I6ICh7IGhlbHBlcnMsIHVzZXJQbHVnaW5PcHRpb25zIH0pID0+IHtcbiAgICAgIGhlbHBlcnMucmVwb3J0ZXIubG9nKGBgKVxuICAgICAgaGVscGVycy5yZXBvcnRlci53YXJuKFxuICAgICAgICBmb3JtYXRMb2dNZXNzYWdlKFxuICAgICAgICAgIGBcXG5cXG5wbHVnaW5PcHRpb25zLnNjaGVtYS5xdWVyeURlcHRoIGlzIG5vdCBhIHBvc2l0aXZlIGludGVnZXIuXFxuVXNpbmcgZGVmYXVsdCB2YWx1ZSBpbiBwbGFjZSBvZiBwcm92aWRlZCB2YWx1ZS5cXG5gLFxuICAgICAgICAgIHsgdXNlVmVyYm9zZVN0eWxlOiB0cnVlIH1cbiAgICAgICAgKVxuICAgICAgKVxuXG4gICAgICBkZWxldGUgdXNlclBsdWdpbk9wdGlvbnMuc2NoZW1hLnF1ZXJ5RGVwdGhcblxuICAgICAgcmV0dXJuIHVzZXJQbHVnaW5PcHRpb25zXG4gICAgfSxcbiAgfSxcbl1cblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NBbmRWYWxpZGF0ZVBsdWdpbk9wdGlvbnMgPSAoaGVscGVycywgcGx1Z2luT3B0aW9ucykgPT4ge1xuICBsZXQgdXNlclBsdWdpbk9wdGlvbnMgPSB7XG4gICAgLi4ucGx1Z2luT3B0aW9ucyxcbiAgfVxuXG4gIG9wdGlvbnNQcm9jZXNzb3JzLmZvckVhY2goKHsgdGVzdCwgcHJvY2Vzc29yLCBuYW1lIH0pID0+IHtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIGhlbHBlcnMucmVwb3J0ZXIucGFuaWMoXG4gICAgICAgIGZvcm1hdExvZ01lc3NhZ2UoXG4gICAgICAgICAgYFBsdWdpbiBvcHRpb24gZmlsdGVyIGlzIHVubmFtZWRcXG5cXG4ke3Rlc3QudG9TdHJpbmcoKX1cXG5cXG4ke3Byb2Nlc3Nvci50b1N0cmluZygpfWBcbiAgICAgICAgKVxuICAgICAgKVxuICAgIH1cblxuICAgIGlmICh0ZXN0KHsgaGVscGVycywgdXNlclBsdWdpbk9wdGlvbnMgfSkpIHtcbiAgICAgIGNvbnN0IGZpbHRlcmVkVXNlclBsdWdpbk9wdGlvbnMgPSBwcm9jZXNzb3Ioe1xuICAgICAgICBoZWxwZXJzLFxuICAgICAgICB1c2VyUGx1Z2luT3B0aW9ucyxcbiAgICAgIH0pXG5cbiAgICAgIGlmIChmaWx0ZXJlZFVzZXJQbHVnaW5PcHRpb25zKSB7XG4gICAgICAgIHVzZXJQbHVnaW5PcHRpb25zID0gZmlsdGVyZWRVc2VyUGx1Z2luT3B0aW9uc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGVscGVycy5yZXBvcnRlci5wYW5pYyhcbiAgICAgICAgICBmb3JtYXRMb2dNZXNzYWdlKFxuICAgICAgICAgICAgYFBsdWdpbiBvcHRpb24gZmlsdGVyICR7bmFtZX0gZGlkbid0IHJldHVybiBhIGZpbHRlcmVkIG9wdGlvbnMgb2JqZWN0YFxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gdXNlclBsdWdpbk9wdGlvbnNcbn1cbiJdfQ==