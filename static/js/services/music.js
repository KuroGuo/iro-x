;(function (angular) { 'use strict';
    angular.module('blog_k.services.music', ['ngResource'])
        .factory('music', ['$resource', function ($resource) {
            return $resource('/api/music/:name');
        }]);
})(angular);