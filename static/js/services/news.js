;(function (angular) { 'use strict';
  angular.module('iro.services.news', [])
    .factory('News', ['$resource', function ($resource) {
      return $resource('/api/news/:id', null, {
        pageQuery: {method: 'GET', params: {startId: null, count: 48}, isArray: true}
      });
    }]);
})(angular);