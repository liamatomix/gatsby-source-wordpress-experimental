"use strict";

exports.__esModule = true;
exports.transformListOfUnions = exports.transformUnion = void 0;

require("source-map-support/register");

var _helpers = require("../helpers");

const transformUnion = ({
  field,
  fieldName
}) => ({
  type: (0, _helpers.buildTypeName)(field.type.name),
  resolve: (source, _, context) => {
    const resolvedField = source[fieldName] || source[`${field.name}__typename_${field.type.name}`];

    if (resolvedField && resolvedField.id) {
      const gatsbyNode = context.nodeModel.getNodeById({
        id: resolvedField.id,
        type: resolvedField.type
      });

      if (gatsbyNode) {
        return gatsbyNode;
      }
    }

    return resolvedField;
  }
});

exports.transformUnion = transformUnion;

const transformListOfUnions = ({
  field,
  fieldName
}) => {
  const typeName = (0, _helpers.buildTypeName)(field.type.ofType.name);
  return {
    type: `[${typeName}]`,
    resolve: (source, _, context) => {
      var _source$fieldName;

      let resolvedField = (_source$fieldName = source[fieldName]) !== null && _source$fieldName !== void 0 ? _source$fieldName : source[`${field.name}__typename_${field.type.name}`];

      if (!resolvedField && resolvedField !== false || !resolvedField.length) {
        return null;
      }

      resolvedField = resolvedField.filter(item => item);
      return resolvedField.map(item => {
        // @todo use our list of Gatsby node types to do a more performant check
        // on wether this is a Gatsby node or not.
        const node = context.nodeModel.getNodeById({
          id: item.id,
          type: (0, _helpers.buildTypeName)(item.__typename)
        });

        if (node) {
          return node;
        }

        return item;
      });
    }
  };
};

exports.transformListOfUnions = transformListOfUnions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vdHJhbnNmb3JtLWZpZWxkcy90cmFuc2Zvcm0tdW5pb24uanMiXSwibmFtZXMiOlsidHJhbnNmb3JtVW5pb24iLCJmaWVsZCIsImZpZWxkTmFtZSIsInR5cGUiLCJuYW1lIiwicmVzb2x2ZSIsInNvdXJjZSIsIl8iLCJjb250ZXh0IiwicmVzb2x2ZWRGaWVsZCIsImlkIiwiZ2F0c2J5Tm9kZSIsIm5vZGVNb2RlbCIsImdldE5vZGVCeUlkIiwidHJhbnNmb3JtTGlzdE9mVW5pb25zIiwidHlwZU5hbWUiLCJvZlR5cGUiLCJsZW5ndGgiLCJmaWx0ZXIiLCJpdGVtIiwibWFwIiwibm9kZSIsIl9fdHlwZW5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFFTyxNQUFNQSxjQUFjLEdBQUcsQ0FBQztBQUFFQyxFQUFBQSxLQUFGO0FBQVNDLEVBQUFBO0FBQVQsQ0FBRCxNQUEyQjtBQUN2REMsRUFBQUEsSUFBSSxFQUFFLDRCQUFjRixLQUFLLENBQUNFLElBQU4sQ0FBV0MsSUFBekIsQ0FEaUQ7QUFFdkRDLEVBQUFBLE9BQU8sRUFBRSxDQUFDQyxNQUFELEVBQVNDLENBQVQsRUFBWUMsT0FBWixLQUF3QjtBQUMvQixVQUFNQyxhQUFhLEdBQ2pCSCxNQUFNLENBQUNKLFNBQUQsQ0FBTixJQUFxQkksTUFBTSxDQUFFLEdBQUVMLEtBQUssQ0FBQ0csSUFBSyxjQUFhSCxLQUFLLENBQUNFLElBQU4sQ0FBV0MsSUFBSyxFQUE1QyxDQUQ3Qjs7QUFHQSxRQUFJSyxhQUFhLElBQUlBLGFBQWEsQ0FBQ0MsRUFBbkMsRUFBdUM7QUFDckMsWUFBTUMsVUFBVSxHQUFHSCxPQUFPLENBQUNJLFNBQVIsQ0FBa0JDLFdBQWxCLENBQThCO0FBQy9DSCxRQUFBQSxFQUFFLEVBQUVELGFBQWEsQ0FBQ0MsRUFENkI7QUFFL0NQLFFBQUFBLElBQUksRUFBRU0sYUFBYSxDQUFDTjtBQUYyQixPQUE5QixDQUFuQjs7QUFLQSxVQUFJUSxVQUFKLEVBQWdCO0FBQ2QsZUFBT0EsVUFBUDtBQUNEO0FBQ0Y7O0FBRUQsV0FBT0YsYUFBUDtBQUNEO0FBbEJzRCxDQUEzQixDQUF2Qjs7OztBQXFCQSxNQUFNSyxxQkFBcUIsR0FBRyxDQUFDO0FBQUViLEVBQUFBLEtBQUY7QUFBU0MsRUFBQUE7QUFBVCxDQUFELEtBQTBCO0FBQzdELFFBQU1hLFFBQVEsR0FBRyw0QkFBY2QsS0FBSyxDQUFDRSxJQUFOLENBQVdhLE1BQVgsQ0FBa0JaLElBQWhDLENBQWpCO0FBRUEsU0FBTztBQUNMRCxJQUFBQSxJQUFJLEVBQUcsSUFBR1ksUUFBUyxHQURkO0FBRUxWLElBQUFBLE9BQU8sRUFBRSxDQUFDQyxNQUFELEVBQVNDLENBQVQsRUFBWUMsT0FBWixLQUF3QjtBQUFBOztBQUMvQixVQUFJQyxhQUFhLHdCQUNmSCxNQUFNLENBQUNKLFNBQUQsQ0FEUyxpRUFFZkksTUFBTSxDQUFFLEdBQUVMLEtBQUssQ0FBQ0csSUFBSyxjQUFhSCxLQUFLLENBQUNFLElBQU4sQ0FBV0MsSUFBSyxFQUE1QyxDQUZSOztBQUlBLFVBQ0csQ0FBQ0ssYUFBRCxJQUFrQkEsYUFBYSxLQUFLLEtBQXJDLElBQ0EsQ0FBQ0EsYUFBYSxDQUFDUSxNQUZqQixFQUdFO0FBQ0EsZUFBTyxJQUFQO0FBQ0Q7O0FBRURSLE1BQUFBLGFBQWEsR0FBR0EsYUFBYSxDQUFDUyxNQUFkLENBQXNCQyxJQUFELElBQVVBLElBQS9CLENBQWhCO0FBRUEsYUFBT1YsYUFBYSxDQUFDVyxHQUFkLENBQW1CRCxJQUFELElBQVU7QUFDakM7QUFDQTtBQUNBLGNBQU1FLElBQUksR0FBR2IsT0FBTyxDQUFDSSxTQUFSLENBQWtCQyxXQUFsQixDQUE4QjtBQUN6Q0gsVUFBQUEsRUFBRSxFQUFFUyxJQUFJLENBQUNULEVBRGdDO0FBRXpDUCxVQUFBQSxJQUFJLEVBQUUsNEJBQWNnQixJQUFJLENBQUNHLFVBQW5CO0FBRm1DLFNBQTlCLENBQWI7O0FBS0EsWUFBSUQsSUFBSixFQUFVO0FBQ1IsaUJBQU9BLElBQVA7QUFDRDs7QUFFRCxlQUFPRixJQUFQO0FBQ0QsT0FiTSxDQUFQO0FBY0Q7QUE5QkksR0FBUDtBQWdDRCxDQW5DTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJ1aWxkVHlwZU5hbWUgfSBmcm9tIFwifi9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vaGVscGVyc1wiXG5cbmV4cG9ydCBjb25zdCB0cmFuc2Zvcm1VbmlvbiA9ICh7IGZpZWxkLCBmaWVsZE5hbWUgfSkgPT4gKHtcbiAgdHlwZTogYnVpbGRUeXBlTmFtZShmaWVsZC50eXBlLm5hbWUpLFxuICByZXNvbHZlOiAoc291cmNlLCBfLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3QgcmVzb2x2ZWRGaWVsZCA9XG4gICAgICBzb3VyY2VbZmllbGROYW1lXSB8fCBzb3VyY2VbYCR7ZmllbGQubmFtZX1fX3R5cGVuYW1lXyR7ZmllbGQudHlwZS5uYW1lfWBdXG5cbiAgICBpZiAocmVzb2x2ZWRGaWVsZCAmJiByZXNvbHZlZEZpZWxkLmlkKSB7XG4gICAgICBjb25zdCBnYXRzYnlOb2RlID0gY29udGV4dC5ub2RlTW9kZWwuZ2V0Tm9kZUJ5SWQoe1xuICAgICAgICBpZDogcmVzb2x2ZWRGaWVsZC5pZCxcbiAgICAgICAgdHlwZTogcmVzb2x2ZWRGaWVsZC50eXBlLFxuICAgICAgfSlcblxuICAgICAgaWYgKGdhdHNieU5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGdhdHNieU5vZGVcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzb2x2ZWRGaWVsZFxuICB9LFxufSlcblxuZXhwb3J0IGNvbnN0IHRyYW5zZm9ybUxpc3RPZlVuaW9ucyA9ICh7IGZpZWxkLCBmaWVsZE5hbWUgfSkgPT4ge1xuICBjb25zdCB0eXBlTmFtZSA9IGJ1aWxkVHlwZU5hbWUoZmllbGQudHlwZS5vZlR5cGUubmFtZSlcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IGBbJHt0eXBlTmFtZX1dYCxcbiAgICByZXNvbHZlOiAoc291cmNlLCBfLCBjb250ZXh0KSA9PiB7XG4gICAgICBsZXQgcmVzb2x2ZWRGaWVsZCA9XG4gICAgICAgIHNvdXJjZVtmaWVsZE5hbWVdID8/XG4gICAgICAgIHNvdXJjZVtgJHtmaWVsZC5uYW1lfV9fdHlwZW5hbWVfJHtmaWVsZC50eXBlLm5hbWV9YF1cblxuICAgICAgaWYgKFxuICAgICAgICAoIXJlc29sdmVkRmllbGQgJiYgcmVzb2x2ZWRGaWVsZCAhPT0gZmFsc2UpIHx8XG4gICAgICAgICFyZXNvbHZlZEZpZWxkLmxlbmd0aFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG5cbiAgICAgIHJlc29sdmVkRmllbGQgPSByZXNvbHZlZEZpZWxkLmZpbHRlcigoaXRlbSkgPT4gaXRlbSlcblxuICAgICAgcmV0dXJuIHJlc29sdmVkRmllbGQubWFwKChpdGVtKSA9PiB7XG4gICAgICAgIC8vIEB0b2RvIHVzZSBvdXIgbGlzdCBvZiBHYXRzYnkgbm9kZSB0eXBlcyB0byBkbyBhIG1vcmUgcGVyZm9ybWFudCBjaGVja1xuICAgICAgICAvLyBvbiB3ZXRoZXIgdGhpcyBpcyBhIEdhdHNieSBub2RlIG9yIG5vdC5cbiAgICAgICAgY29uc3Qgbm9kZSA9IGNvbnRleHQubm9kZU1vZGVsLmdldE5vZGVCeUlkKHtcbiAgICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgICB0eXBlOiBidWlsZFR5cGVOYW1lKGl0ZW0uX190eXBlbmFtZSksXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGl0ZW1cbiAgICAgIH0pXG4gICAgfSxcbiAgfVxufVxuIl19