;(function (angular) { 'use strict';
  angular.module('iro.services.news', [])
    .factory('News', ['$resource', function ($resource) {
      return $resource('/api/news/:id', null, {
        pageQuery: {method: 'GET', params: {page: 1, pagesize: 50}, isArray: true}
      });
    }]);
})(angular);