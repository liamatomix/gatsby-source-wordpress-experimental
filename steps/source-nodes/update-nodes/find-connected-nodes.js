"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.findConnectedNodeIds = void 0;

var _dumper = require("dumper.js");

require("source-map-support/register");

var _flattenDeep = _interopRequireDefault(require("lodash/flattenDeep"));

// After all nodes are created while building the schema, store possible node type relationships. So for example when building the WpPost type, for every gatsby node discovered as a potential connected node type WpPost's fields, record that in redux as WpPost => [...ConnectedTypeNames].
// when creating or updating a Page incrementally, we should find all connected node ids, check the types of each of those id's, if any connected id type has the current node type as a potential connected node type, AND this node is not a connected node of that node, we should refetch that node in case it's now a connected node.
// So we create a new Page, we then check the connected node id's and determine that one of them is a User type. The User type has Page as a potential connected node. So we check if this node is a connected node of that node. If it's not we can't be sure that that User node isn't missing this node as a connected node. So we refetch the connected node of our Page which is a User. Do this for all connected nodes where we can't find a relationship back.
const recursivelySearchForIds = ([key, value]) => {
  if (!key || !value) {
    return null;
  }

  if (key === `id`) {
    return value;
  } else if (typeof value === `string` || typeof value === `number`) {
    return null;
  }

  if (Array.isArray(value)) {
    (0, _dumper.dump)(key); // loop through each value of the array. If it's an object recurse on it's fields
    // if it's anything else skip it.

    value.map(innerValue => {
      if (innerValue === null) {
        return null;
      }

      if (key === `id` && typeof innerValue === `string`) {
        return innerValue;
      }

      if (typeof innerValue === `object`) {
        return Object.values(innerValue).map(recursivelySearchForIds);
      }

      return null;
    });
  } else if (typeof value === `object`) {
    (0, _dumper.dump)(key);
    return Object.entries(value).map(recursivelySearchForIds);
  }

  return null;
};

const findConnectedNodeIds = node => {
  const childNodeIds = [...new Set((0, _flattenDeep.default)(Object.entries(node).map(recursivelySearchForIds)).filter(id => id !== node.id && !!id))];

  if (!childNodeIds.length) {
    return null;
  }

  return childNodeIds;
};

exports.findConnectedNodeIds = findConnectedNodeIds;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvdXBkYXRlLW5vZGVzL2ZpbmQtY29ubmVjdGVkLW5vZGVzLmpzIl0sIm5hbWVzIjpbInJlY3Vyc2l2ZWx5U2VhcmNoRm9ySWRzIiwia2V5IiwidmFsdWUiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJpbm5lclZhbHVlIiwiT2JqZWN0IiwidmFsdWVzIiwiZW50cmllcyIsImZpbmRDb25uZWN0ZWROb2RlSWRzIiwibm9kZSIsImNoaWxkTm9kZUlkcyIsIlNldCIsImZpbHRlciIsImlkIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUVBO0FBRUE7QUFFQTtBQUVBLE1BQU1BLHVCQUF1QixHQUFHLENBQUMsQ0FBQ0MsR0FBRCxFQUFNQyxLQUFOLENBQUQsS0FBa0I7QUFDaEQsTUFBSSxDQUFDRCxHQUFELElBQVEsQ0FBQ0MsS0FBYixFQUFvQjtBQUNsQixXQUFPLElBQVA7QUFDRDs7QUFFRCxNQUFJRCxHQUFHLEtBQU0sSUFBYixFQUFrQjtBQUNoQixXQUFPQyxLQUFQO0FBQ0QsR0FGRCxNQUVPLElBQUksT0FBT0EsS0FBUCxLQUFrQixRQUFsQixJQUE2QixPQUFPQSxLQUFQLEtBQWtCLFFBQW5ELEVBQTREO0FBQ2pFLFdBQU8sSUFBUDtBQUNEOztBQUVELE1BQUlDLEtBQUssQ0FBQ0MsT0FBTixDQUFjRixLQUFkLENBQUosRUFBMEI7QUFDeEIsc0JBQUtELEdBQUwsRUFEd0IsQ0FFeEI7QUFDQTs7QUFDQUMsSUFBQUEsS0FBSyxDQUFDRyxHQUFOLENBQVdDLFVBQUQsSUFBZ0I7QUFDeEIsVUFBSUEsVUFBVSxLQUFLLElBQW5CLEVBQXlCO0FBQ3ZCLGVBQU8sSUFBUDtBQUNEOztBQUVELFVBQUlMLEdBQUcsS0FBTSxJQUFULElBQWdCLE9BQU9LLFVBQVAsS0FBdUIsUUFBM0MsRUFBb0Q7QUFDbEQsZUFBT0EsVUFBUDtBQUNEOztBQUVELFVBQUksT0FBT0EsVUFBUCxLQUF1QixRQUEzQixFQUFvQztBQUNsQyxlQUFPQyxNQUFNLENBQUNDLE1BQVAsQ0FBY0YsVUFBZCxFQUEwQkQsR0FBMUIsQ0FBOEJMLHVCQUE5QixDQUFQO0FBQ0Q7O0FBRUQsYUFBTyxJQUFQO0FBQ0QsS0FkRDtBQWVELEdBbkJELE1BbUJPLElBQUksT0FBT0UsS0FBUCxLQUFrQixRQUF0QixFQUErQjtBQUNwQyxzQkFBS0QsR0FBTDtBQUNBLFdBQU9NLE1BQU0sQ0FBQ0UsT0FBUCxDQUFlUCxLQUFmLEVBQXNCRyxHQUF0QixDQUEwQkwsdUJBQTFCLENBQVA7QUFDRDs7QUFFRCxTQUFPLElBQVA7QUFDRCxDQXBDRDs7QUFzQ08sTUFBTVUsb0JBQW9CLEdBQUlDLElBQUQsSUFBVTtBQUM1QyxRQUFNQyxZQUFZLEdBQUcsQ0FDbkIsR0FBRyxJQUFJQyxHQUFKLENBQ0QsMEJBQVlOLE1BQU0sQ0FBQ0UsT0FBUCxDQUFlRSxJQUFmLEVBQXFCTixHQUFyQixDQUF5QkwsdUJBQXpCLENBQVosRUFBK0RjLE1BQS9ELENBQ0dDLEVBQUQsSUFBUUEsRUFBRSxLQUFLSixJQUFJLENBQUNJLEVBQVosSUFBa0IsQ0FBQyxDQUFDQSxFQUQ5QixDQURDLENBRGdCLENBQXJCOztBQVFBLE1BQUksQ0FBQ0gsWUFBWSxDQUFDSSxNQUFsQixFQUEwQjtBQUN4QixXQUFPLElBQVA7QUFDRDs7QUFFRCxTQUFPSixZQUFQO0FBQ0QsQ0FkTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmbGF0dGVuRGVlcCBmcm9tIFwibG9kYXNoL2ZsYXR0ZW5EZWVwXCJcblxuLy8gQWZ0ZXIgYWxsIG5vZGVzIGFyZSBjcmVhdGVkIHdoaWxlIGJ1aWxkaW5nIHRoZSBzY2hlbWEsIHN0b3JlIHBvc3NpYmxlIG5vZGUgdHlwZSByZWxhdGlvbnNoaXBzLiBTbyBmb3IgZXhhbXBsZSB3aGVuIGJ1aWxkaW5nIHRoZSBXcFBvc3QgdHlwZSwgZm9yIGV2ZXJ5IGdhdHNieSBub2RlIGRpc2NvdmVyZWQgYXMgYSBwb3RlbnRpYWwgY29ubmVjdGVkIG5vZGUgdHlwZSBXcFBvc3QncyBmaWVsZHMsIHJlY29yZCB0aGF0IGluIHJlZHV4IGFzIFdwUG9zdCA9PiBbLi4uQ29ubmVjdGVkVHlwZU5hbWVzXS5cblxuLy8gd2hlbiBjcmVhdGluZyBvciB1cGRhdGluZyBhIFBhZ2UgaW5jcmVtZW50YWxseSwgd2Ugc2hvdWxkIGZpbmQgYWxsIGNvbm5lY3RlZCBub2RlIGlkcywgY2hlY2sgdGhlIHR5cGVzIG9mIGVhY2ggb2YgdGhvc2UgaWQncywgaWYgYW55IGNvbm5lY3RlZCBpZCB0eXBlIGhhcyB0aGUgY3VycmVudCBub2RlIHR5cGUgYXMgYSBwb3RlbnRpYWwgY29ubmVjdGVkIG5vZGUgdHlwZSwgQU5EIHRoaXMgbm9kZSBpcyBub3QgYSBjb25uZWN0ZWQgbm9kZSBvZiB0aGF0IG5vZGUsIHdlIHNob3VsZCByZWZldGNoIHRoYXQgbm9kZSBpbiBjYXNlIGl0J3Mgbm93IGEgY29ubmVjdGVkIG5vZGUuXG5cbi8vIFNvIHdlIGNyZWF0ZSBhIG5ldyBQYWdlLCB3ZSB0aGVuIGNoZWNrIHRoZSBjb25uZWN0ZWQgbm9kZSBpZCdzIGFuZCBkZXRlcm1pbmUgdGhhdCBvbmUgb2YgdGhlbSBpcyBhIFVzZXIgdHlwZS4gVGhlIFVzZXIgdHlwZSBoYXMgUGFnZSBhcyBhIHBvdGVudGlhbCBjb25uZWN0ZWQgbm9kZS4gU28gd2UgY2hlY2sgaWYgdGhpcyBub2RlIGlzIGEgY29ubmVjdGVkIG5vZGUgb2YgdGhhdCBub2RlLiBJZiBpdCdzIG5vdCB3ZSBjYW4ndCBiZSBzdXJlIHRoYXQgdGhhdCBVc2VyIG5vZGUgaXNuJ3QgbWlzc2luZyB0aGlzIG5vZGUgYXMgYSBjb25uZWN0ZWQgbm9kZS4gU28gd2UgcmVmZXRjaCB0aGUgY29ubmVjdGVkIG5vZGUgb2Ygb3VyIFBhZ2Ugd2hpY2ggaXMgYSBVc2VyLiBEbyB0aGlzIGZvciBhbGwgY29ubmVjdGVkIG5vZGVzIHdoZXJlIHdlIGNhbid0IGZpbmQgYSByZWxhdGlvbnNoaXAgYmFjay5cblxuY29uc3QgcmVjdXJzaXZlbHlTZWFyY2hGb3JJZHMgPSAoW2tleSwgdmFsdWVdKSA9PiB7XG4gIGlmICgha2V5IHx8ICF2YWx1ZSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBpZiAoa2V5ID09PSBgaWRgKSB7XG4gICAgcmV0dXJuIHZhbHVlXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBgc3RyaW5nYCB8fCB0eXBlb2YgdmFsdWUgPT09IGBudW1iZXJgKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIGR1bXAoa2V5KVxuICAgIC8vIGxvb3AgdGhyb3VnaCBlYWNoIHZhbHVlIG9mIHRoZSBhcnJheS4gSWYgaXQncyBhbiBvYmplY3QgcmVjdXJzZSBvbiBpdCdzIGZpZWxkc1xuICAgIC8vIGlmIGl0J3MgYW55dGhpbmcgZWxzZSBza2lwIGl0LlxuICAgIHZhbHVlLm1hcCgoaW5uZXJWYWx1ZSkgPT4ge1xuICAgICAgaWYgKGlubmVyVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cblxuICAgICAgaWYgKGtleSA9PT0gYGlkYCAmJiB0eXBlb2YgaW5uZXJWYWx1ZSA9PT0gYHN0cmluZ2ApIHtcbiAgICAgICAgcmV0dXJuIGlubmVyVmFsdWVcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBpbm5lclZhbHVlID09PSBgb2JqZWN0YCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhpbm5lclZhbHVlKS5tYXAocmVjdXJzaXZlbHlTZWFyY2hGb3JJZHMpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsXG4gICAgfSlcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IGBvYmplY3RgKSB7XG4gICAgZHVtcChrZXkpXG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHZhbHVlKS5tYXAocmVjdXJzaXZlbHlTZWFyY2hGb3JJZHMpXG4gIH1cblxuICByZXR1cm4gbnVsbFxufVxuXG5leHBvcnQgY29uc3QgZmluZENvbm5lY3RlZE5vZGVJZHMgPSAobm9kZSkgPT4ge1xuICBjb25zdCBjaGlsZE5vZGVJZHMgPSBbXG4gICAgLi4ubmV3IFNldChcbiAgICAgIGZsYXR0ZW5EZWVwKE9iamVjdC5lbnRyaWVzKG5vZGUpLm1hcChyZWN1cnNpdmVseVNlYXJjaEZvcklkcykpLmZpbHRlcihcbiAgICAgICAgKGlkKSA9PiBpZCAhPT0gbm9kZS5pZCAmJiAhIWlkXG4gICAgICApXG4gICAgKSxcbiAgXVxuXG4gIGlmICghY2hpbGROb2RlSWRzLmxlbmd0aCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gY2hpbGROb2RlSWRzXG59XG4iXX0=