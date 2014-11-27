;(function (angular) { 'use strict';
  angular.module('iro.services.music', ['ngResource'])
    .factory('music', ['$resource', function ($resource) {
      return $resource('/api/music/:name');
    }]);
})(angular);