;(function (angular) { 'use strict';
  angular.module('iro.services.music', ['ngResource'])
    .factory('Music', ['$resource', function ($resource) {
      return $resource('/api/music/:name');
    }]);
})(angular);