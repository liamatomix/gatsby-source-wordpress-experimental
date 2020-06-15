"use strict";

exports.__esModule = true;
exports.transformGatsbyNodeObject = exports.transformListOfGatsbyNodes = void 0;

require("source-map-support/register");

var _helpers = require("../helpers");

var _update = require("../../source-nodes/update-nodes/wp-actions/update");

var _helpers2 = require("../../source-nodes/helpers");

var _getGatsbyApi = require("../../../utils/get-gatsby-api");

const transformListOfGatsbyNodes = ({
  field,
  fieldName
}) => {
  const typeName = (0, _helpers.buildTypeName)(field.type.ofType.name);
  return {
    type: `[${typeName}]`,
    resolve: (source, _, context) => {
      let nodes = null;
      const field = source[fieldName];

      if (field && Array.isArray(field)) {
        nodes = field; // @todo determine if this else if is necessary
        // I think it isn't. The test for this in field-transformers.js line 48
        // is checking if this is a list of Gatsby nodes which means it should be
        // an array, not an object type with nodes as a field.
        // leaving this for now as I have no automated tests yet :scream:
      } else if (source && source.nodes && source.nodes.length) {
        nodes = source.nodes;
      }

      if (!nodes) {
        return null;
      }

      return context.nodeModel.getNodesByIds({
        ids: nodes.map(node => node.id),
        type: typeName
      });
    }
  };
};

exports.transformListOfGatsbyNodes = transformListOfGatsbyNodes;

const transformGatsbyNodeObject = ({
  field,
  fieldName
}) => {
  const typeName = (0, _helpers.buildTypeName)(field.type.name);
  return {
    type: typeName,
    resolve: async (source, _, context) => {
      const nodeField = source[fieldName];

      if (!nodeField || nodeField && !nodeField.id) {
        return null;
      }

      const existingNode = context.nodeModel.getNodeById({
        id: nodeField.id,
        type: typeName
      });

      if (existingNode) {
        return existingNode;
      }

      const queryInfo = (0, _helpers2.getQueryInfoByTypeName)(field.type.name); // if this node doesn't exist, fetch it and create a node

      const {
        node
      } = await (0, _update.fetchAndCreateSingleNode)({
        id: nodeField.id,
        actionType: `CREATE`,
        singleName: queryInfo.typeInfo.singularName
      });

      if (source.id && node) {
        const {
          helpers
        } = (0, _getGatsbyApi.getGatsbyApi)();
        await helpers.actions.createParentChildLink({
          parent: source,
          child: node
        });
      }

      return node || null;
    }
  };
};

exports.transformGatsbyNodeObject = transformGatsbyNodeObject;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vdHJhbnNmb3JtLWZpZWxkcy90cmFuc2Zvcm0tb2JqZWN0LmpzIl0sIm5hbWVzIjpbInRyYW5zZm9ybUxpc3RPZkdhdHNieU5vZGVzIiwiZmllbGQiLCJmaWVsZE5hbWUiLCJ0eXBlTmFtZSIsInR5cGUiLCJvZlR5cGUiLCJuYW1lIiwicmVzb2x2ZSIsInNvdXJjZSIsIl8iLCJjb250ZXh0Iiwibm9kZXMiLCJBcnJheSIsImlzQXJyYXkiLCJsZW5ndGgiLCJub2RlTW9kZWwiLCJnZXROb2Rlc0J5SWRzIiwiaWRzIiwibWFwIiwibm9kZSIsImlkIiwidHJhbnNmb3JtR2F0c2J5Tm9kZU9iamVjdCIsIm5vZGVGaWVsZCIsImV4aXN0aW5nTm9kZSIsImdldE5vZGVCeUlkIiwicXVlcnlJbmZvIiwiYWN0aW9uVHlwZSIsInNpbmdsZU5hbWUiLCJ0eXBlSW5mbyIsInNpbmd1bGFyTmFtZSIsImhlbHBlcnMiLCJhY3Rpb25zIiwiY3JlYXRlUGFyZW50Q2hpbGRMaW5rIiwicGFyZW50IiwiY2hpbGQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFTyxNQUFNQSwwQkFBMEIsR0FBRyxDQUFDO0FBQUVDLEVBQUFBLEtBQUY7QUFBU0MsRUFBQUE7QUFBVCxDQUFELEtBQTBCO0FBQ2xFLFFBQU1DLFFBQVEsR0FBRyw0QkFBY0YsS0FBSyxDQUFDRyxJQUFOLENBQVdDLE1BQVgsQ0FBa0JDLElBQWhDLENBQWpCO0FBRUEsU0FBTztBQUNMRixJQUFBQSxJQUFJLEVBQUcsSUFBR0QsUUFBUyxHQURkO0FBRUxJLElBQUFBLE9BQU8sRUFBRSxDQUFDQyxNQUFELEVBQVNDLENBQVQsRUFBWUMsT0FBWixLQUF3QjtBQUMvQixVQUFJQyxLQUFLLEdBQUcsSUFBWjtBQUVBLFlBQU1WLEtBQUssR0FBR08sTUFBTSxDQUFDTixTQUFELENBQXBCOztBQUVBLFVBQUlELEtBQUssSUFBSVcsS0FBSyxDQUFDQyxPQUFOLENBQWNaLEtBQWQsQ0FBYixFQUFtQztBQUNqQ1UsUUFBQUEsS0FBSyxHQUFHVixLQUFSLENBRGlDLENBR2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRCxPQVJELE1BUU8sSUFBSU8sTUFBTSxJQUFJQSxNQUFNLENBQUNHLEtBQWpCLElBQTBCSCxNQUFNLENBQUNHLEtBQVAsQ0FBYUcsTUFBM0MsRUFBbUQ7QUFDeERILFFBQUFBLEtBQUssR0FBR0gsTUFBTSxDQUFDRyxLQUFmO0FBQ0Q7O0FBRUQsVUFBSSxDQUFDQSxLQUFMLEVBQVk7QUFDVixlQUFPLElBQVA7QUFDRDs7QUFFRCxhQUFPRCxPQUFPLENBQUNLLFNBQVIsQ0FBa0JDLGFBQWxCLENBQWdDO0FBQ3JDQyxRQUFBQSxHQUFHLEVBQUVOLEtBQUssQ0FBQ08sR0FBTixDQUFXQyxJQUFELElBQVVBLElBQUksQ0FBQ0MsRUFBekIsQ0FEZ0M7QUFFckNoQixRQUFBQSxJQUFJLEVBQUVEO0FBRitCLE9BQWhDLENBQVA7QUFJRDtBQTNCSSxHQUFQO0FBNkJELENBaENNOzs7O0FBa0NBLE1BQU1rQix5QkFBeUIsR0FBRyxDQUFDO0FBQUVwQixFQUFBQSxLQUFGO0FBQVNDLEVBQUFBO0FBQVQsQ0FBRCxLQUEwQjtBQUNqRSxRQUFNQyxRQUFRLEdBQUcsNEJBQWNGLEtBQUssQ0FBQ0csSUFBTixDQUFXRSxJQUF6QixDQUFqQjtBQUVBLFNBQU87QUFDTEYsSUFBQUEsSUFBSSxFQUFFRCxRQUREO0FBRUxJLElBQUFBLE9BQU8sRUFBRSxPQUFPQyxNQUFQLEVBQWVDLENBQWYsRUFBa0JDLE9BQWxCLEtBQThCO0FBQ3JDLFlBQU1ZLFNBQVMsR0FBR2QsTUFBTSxDQUFDTixTQUFELENBQXhCOztBQUVBLFVBQUksQ0FBQ29CLFNBQUQsSUFBZUEsU0FBUyxJQUFJLENBQUNBLFNBQVMsQ0FBQ0YsRUFBM0MsRUFBZ0Q7QUFDOUMsZUFBTyxJQUFQO0FBQ0Q7O0FBRUQsWUFBTUcsWUFBWSxHQUFHYixPQUFPLENBQUNLLFNBQVIsQ0FBa0JTLFdBQWxCLENBQThCO0FBQ2pESixRQUFBQSxFQUFFLEVBQUVFLFNBQVMsQ0FBQ0YsRUFEbUM7QUFFakRoQixRQUFBQSxJQUFJLEVBQUVEO0FBRjJDLE9BQTlCLENBQXJCOztBQUtBLFVBQUlvQixZQUFKLEVBQWtCO0FBQ2hCLGVBQU9BLFlBQVA7QUFDRDs7QUFFRCxZQUFNRSxTQUFTLEdBQUcsc0NBQXVCeEIsS0FBSyxDQUFDRyxJQUFOLENBQVdFLElBQWxDLENBQWxCLENBaEJxQyxDQWtCckM7O0FBQ0EsWUFBTTtBQUFFYSxRQUFBQTtBQUFGLFVBQVcsTUFBTSxzQ0FBeUI7QUFDOUNDLFFBQUFBLEVBQUUsRUFBRUUsU0FBUyxDQUFDRixFQURnQztBQUU5Q00sUUFBQUEsVUFBVSxFQUFHLFFBRmlDO0FBRzlDQyxRQUFBQSxVQUFVLEVBQUVGLFNBQVMsQ0FBQ0csUUFBVixDQUFtQkM7QUFIZSxPQUF6QixDQUF2Qjs7QUFNQSxVQUFJckIsTUFBTSxDQUFDWSxFQUFQLElBQWFELElBQWpCLEVBQXVCO0FBQ3JCLGNBQU07QUFBRVcsVUFBQUE7QUFBRixZQUFjLGlDQUFwQjtBQUVBLGNBQU1BLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQkMscUJBQWhCLENBQXNDO0FBQzFDQyxVQUFBQSxNQUFNLEVBQUV6QixNQURrQztBQUUxQzBCLFVBQUFBLEtBQUssRUFBRWY7QUFGbUMsU0FBdEMsQ0FBTjtBQUlEOztBQUVELGFBQU9BLElBQUksSUFBSSxJQUFmO0FBQ0Q7QUFyQ0ksR0FBUDtBQXVDRCxDQTFDTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJ1aWxkVHlwZU5hbWUgfSBmcm9tIFwifi9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vaGVscGVyc1wiXG5pbXBvcnQgeyBmZXRjaEFuZENyZWF0ZVNpbmdsZU5vZGUgfSBmcm9tIFwifi9zdGVwcy9zb3VyY2Utbm9kZXMvdXBkYXRlLW5vZGVzL3dwLWFjdGlvbnMvdXBkYXRlXCJcbmltcG9ydCB7IGdldFF1ZXJ5SW5mb0J5VHlwZU5hbWUgfSBmcm9tIFwifi9zdGVwcy9zb3VyY2Utbm9kZXMvaGVscGVyc1wiXG5pbXBvcnQgeyBnZXRHYXRzYnlBcGkgfSBmcm9tIFwifi91dGlscy9nZXQtZ2F0c2J5LWFwaVwiXG5cbmV4cG9ydCBjb25zdCB0cmFuc2Zvcm1MaXN0T2ZHYXRzYnlOb2RlcyA9ICh7IGZpZWxkLCBmaWVsZE5hbWUgfSkgPT4ge1xuICBjb25zdCB0eXBlTmFtZSA9IGJ1aWxkVHlwZU5hbWUoZmllbGQudHlwZS5vZlR5cGUubmFtZSlcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IGBbJHt0eXBlTmFtZX1dYCxcbiAgICByZXNvbHZlOiAoc291cmNlLCBfLCBjb250ZXh0KSA9PiB7XG4gICAgICBsZXQgbm9kZXMgPSBudWxsXG5cbiAgICAgIGNvbnN0IGZpZWxkID0gc291cmNlW2ZpZWxkTmFtZV1cblxuICAgICAgaWYgKGZpZWxkICYmIEFycmF5LmlzQXJyYXkoZmllbGQpKSB7XG4gICAgICAgIG5vZGVzID0gZmllbGRcblxuICAgICAgICAvLyBAdG9kbyBkZXRlcm1pbmUgaWYgdGhpcyBlbHNlIGlmIGlzIG5lY2Vzc2FyeVxuICAgICAgICAvLyBJIHRoaW5rIGl0IGlzbid0LiBUaGUgdGVzdCBmb3IgdGhpcyBpbiBmaWVsZC10cmFuc2Zvcm1lcnMuanMgbGluZSA0OFxuICAgICAgICAvLyBpcyBjaGVja2luZyBpZiB0aGlzIGlzIGEgbGlzdCBvZiBHYXRzYnkgbm9kZXMgd2hpY2ggbWVhbnMgaXQgc2hvdWxkIGJlXG4gICAgICAgIC8vIGFuIGFycmF5LCBub3QgYW4gb2JqZWN0IHR5cGUgd2l0aCBub2RlcyBhcyBhIGZpZWxkLlxuICAgICAgICAvLyBsZWF2aW5nIHRoaXMgZm9yIG5vdyBhcyBJIGhhdmUgbm8gYXV0b21hdGVkIHRlc3RzIHlldCA6c2NyZWFtOlxuICAgICAgfSBlbHNlIGlmIChzb3VyY2UgJiYgc291cmNlLm5vZGVzICYmIHNvdXJjZS5ub2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgbm9kZXMgPSBzb3VyY2Uubm9kZXNcbiAgICAgIH1cblxuICAgICAgaWYgKCFub2Rlcykge1xuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29udGV4dC5ub2RlTW9kZWwuZ2V0Tm9kZXNCeUlkcyh7XG4gICAgICAgIGlkczogbm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKSxcbiAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICB9KVxuICAgIH0sXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHRyYW5zZm9ybUdhdHNieU5vZGVPYmplY3QgPSAoeyBmaWVsZCwgZmllbGROYW1lIH0pID0+IHtcbiAgY29uc3QgdHlwZU5hbWUgPSBidWlsZFR5cGVOYW1lKGZpZWxkLnR5cGUubmFtZSlcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGVOYW1lLFxuICAgIHJlc29sdmU6IGFzeW5jIChzb3VyY2UsIF8sIGNvbnRleHQpID0+IHtcbiAgICAgIGNvbnN0IG5vZGVGaWVsZCA9IHNvdXJjZVtmaWVsZE5hbWVdXG5cbiAgICAgIGlmICghbm9kZUZpZWxkIHx8IChub2RlRmllbGQgJiYgIW5vZGVGaWVsZC5pZCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXhpc3RpbmdOb2RlID0gY29udGV4dC5ub2RlTW9kZWwuZ2V0Tm9kZUJ5SWQoe1xuICAgICAgICBpZDogbm9kZUZpZWxkLmlkLFxuICAgICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgIH0pXG5cbiAgICAgIGlmIChleGlzdGluZ05vZGUpIHtcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nTm9kZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBxdWVyeUluZm8gPSBnZXRRdWVyeUluZm9CeVR5cGVOYW1lKGZpZWxkLnR5cGUubmFtZSlcblxuICAgICAgLy8gaWYgdGhpcyBub2RlIGRvZXNuJ3QgZXhpc3QsIGZldGNoIGl0IGFuZCBjcmVhdGUgYSBub2RlXG4gICAgICBjb25zdCB7IG5vZGUgfSA9IGF3YWl0IGZldGNoQW5kQ3JlYXRlU2luZ2xlTm9kZSh7XG4gICAgICAgIGlkOiBub2RlRmllbGQuaWQsXG4gICAgICAgIGFjdGlvblR5cGU6IGBDUkVBVEVgLFxuICAgICAgICBzaW5nbGVOYW1lOiBxdWVyeUluZm8udHlwZUluZm8uc2luZ3VsYXJOYW1lLFxuICAgICAgfSlcblxuICAgICAgaWYgKHNvdXJjZS5pZCAmJiBub2RlKSB7XG4gICAgICAgIGNvbnN0IHsgaGVscGVycyB9ID0gZ2V0R2F0c2J5QXBpKClcblxuICAgICAgICBhd2FpdCBoZWxwZXJzLmFjdGlvbnMuY3JlYXRlUGFyZW50Q2hpbGRMaW5rKHtcbiAgICAgICAgICBwYXJlbnQ6IHNvdXJjZSxcbiAgICAgICAgICBjaGlsZDogbm9kZSxcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGUgfHwgbnVsbFxuICAgIH0sXG4gIH1cbn1cbiJdfQ==