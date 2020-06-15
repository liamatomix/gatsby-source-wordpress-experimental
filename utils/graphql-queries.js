"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.introspectionQuery = exports.actionMonitorQuery = void 0;

require("source-map-support/register");

var _gql = _interopRequireDefault(require("./gql"));

/**
 * Used to fetch WP changes since a unix timestamp
 * so we can do incremental data fetches
 */
const actionMonitorQuery = (0, _gql.default)`
  query GET_ACTION_MONITOR_ACTIONS($since: Float!, $after: String) {
    # @todo add pagination in case there are more than 100 actions since the last build
    actionMonitorActions(
      # @todo the orderby args aren't actually doing anything here. need to fix this
      where: { sinceTimestamp: $since, orderby: { field: DATE, order: DESC } }
      first: 100
      after: $after
    ) {
      nodes {
        id
        title
        actionType
        referencedNodeID
        referencedNodeStatus
        referencedNodeGlobalRelayID
        referencedNodeSingularName
        referencedNodePluralName
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
exports.actionMonitorQuery = actionMonitorQuery;
const introspectionQuery = (0, _gql.default)`
  {
    __schema {
      types {
        kind
        name
        description

        possibleTypes {
          kind
          name
        }
        interfaces {
          kind
          name
        }
        enumValues {
          name
        }
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
        fields {
          name
          description
          args {
            name
            type {
              kind
              name
              inputFields {
                name
              }
            }
          }
          type {
            name
            kind
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }

      mutationType {
        fields {
          type {
            name
          }
        }
      }
    }
  }
`;
exports.introspectionQuery = introspectionQuery;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9ncmFwaHFsLXF1ZXJpZXMuanMiXSwibmFtZXMiOlsiYWN0aW9uTW9uaXRvclF1ZXJ5IiwiaW50cm9zcGVjdGlvblF1ZXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFFQTs7OztBQUlPLE1BQU1BLGtCQUFrQixHQUFHLGlCQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBQS9COztBQTJCQSxNQUFNQyxrQkFBa0IsR0FBRyxpQkFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBQS9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGdxbCBmcm9tIFwiLi9ncWxcIlxuXG4vKipcbiAqIFVzZWQgdG8gZmV0Y2ggV1AgY2hhbmdlcyBzaW5jZSBhIHVuaXggdGltZXN0YW1wXG4gKiBzbyB3ZSBjYW4gZG8gaW5jcmVtZW50YWwgZGF0YSBmZXRjaGVzXG4gKi9cbmV4cG9ydCBjb25zdCBhY3Rpb25Nb25pdG9yUXVlcnkgPSBncWxgXG4gIHF1ZXJ5IEdFVF9BQ1RJT05fTU9OSVRPUl9BQ1RJT05TKCRzaW5jZTogRmxvYXQhLCAkYWZ0ZXI6IFN0cmluZykge1xuICAgICMgQHRvZG8gYWRkIHBhZ2luYXRpb24gaW4gY2FzZSB0aGVyZSBhcmUgbW9yZSB0aGFuIDEwMCBhY3Rpb25zIHNpbmNlIHRoZSBsYXN0IGJ1aWxkXG4gICAgYWN0aW9uTW9uaXRvckFjdGlvbnMoXG4gICAgICAjIEB0b2RvIHRoZSBvcmRlcmJ5IGFyZ3MgYXJlbid0IGFjdHVhbGx5IGRvaW5nIGFueXRoaW5nIGhlcmUuIG5lZWQgdG8gZml4IHRoaXNcbiAgICAgIHdoZXJlOiB7IHNpbmNlVGltZXN0YW1wOiAkc2luY2UsIG9yZGVyYnk6IHsgZmllbGQ6IERBVEUsIG9yZGVyOiBERVNDIH0gfVxuICAgICAgZmlyc3Q6IDEwMFxuICAgICAgYWZ0ZXI6ICRhZnRlclxuICAgICkge1xuICAgICAgbm9kZXMge1xuICAgICAgICBpZFxuICAgICAgICB0aXRsZVxuICAgICAgICBhY3Rpb25UeXBlXG4gICAgICAgIHJlZmVyZW5jZWROb2RlSURcbiAgICAgICAgcmVmZXJlbmNlZE5vZGVTdGF0dXNcbiAgICAgICAgcmVmZXJlbmNlZE5vZGVHbG9iYWxSZWxheUlEXG4gICAgICAgIHJlZmVyZW5jZWROb2RlU2luZ3VsYXJOYW1lXG4gICAgICAgIHJlZmVyZW5jZWROb2RlUGx1cmFsTmFtZVxuICAgICAgfVxuICAgICAgcGFnZUluZm8ge1xuICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgICBlbmRDdXJzb3JcbiAgICAgIH1cbiAgICB9XG4gIH1cbmBcblxuZXhwb3J0IGNvbnN0IGludHJvc3BlY3Rpb25RdWVyeSA9IGdxbGBcbiAge1xuICAgIF9fc2NoZW1hIHtcbiAgICAgIHR5cGVzIHtcbiAgICAgICAga2luZFxuICAgICAgICBuYW1lXG4gICAgICAgIGRlc2NyaXB0aW9uXG5cbiAgICAgICAgcG9zc2libGVUeXBlcyB7XG4gICAgICAgICAga2luZFxuICAgICAgICAgIG5hbWVcbiAgICAgICAgfVxuICAgICAgICBpbnRlcmZhY2VzIHtcbiAgICAgICAgICBraW5kXG4gICAgICAgICAgbmFtZVxuICAgICAgICB9XG4gICAgICAgIGVudW1WYWx1ZXMge1xuICAgICAgICAgIG5hbWVcbiAgICAgICAgfVxuICAgICAgICBvZlR5cGUge1xuICAgICAgICAgIGtpbmRcbiAgICAgICAgICBuYW1lXG4gICAgICAgICAgb2ZUeXBlIHtcbiAgICAgICAgICAgIGtpbmRcbiAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgIG9mVHlwZSB7XG4gICAgICAgICAgICAgIGtpbmRcbiAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmaWVsZHMge1xuICAgICAgICAgIG5hbWVcbiAgICAgICAgICBkZXNjcmlwdGlvblxuICAgICAgICAgIGFyZ3Mge1xuICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgdHlwZSB7XG4gICAgICAgICAgICAgIGtpbmRcbiAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICBpbnB1dEZpZWxkcyB7XG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHR5cGUge1xuICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAga2luZFxuICAgICAgICAgICAgb2ZUeXBlIHtcbiAgICAgICAgICAgICAga2luZFxuICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICAgIG9mVHlwZSB7XG4gICAgICAgICAgICAgICAga2luZFxuICAgICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgICAgICBvZlR5cGUge1xuICAgICAgICAgICAgICAgICAga2luZFxuICAgICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtdXRhdGlvblR5cGUge1xuICAgICAgICBmaWVsZHMge1xuICAgICAgICAgIHR5cGUge1xuICAgICAgICAgICAgbmFtZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuYFxuIl19