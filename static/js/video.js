;(function (angular) { 'use strict';
  angular.module('iro.video', ['iro.services.memory', 'k-player'])
    .controller('VideoCtrl', ['$scope', function ($scope) {
      $scope.global.title = '视频';
    }])
    .directive('iroVideo', ['$window', 'memory', function ($window, memory) {
      return {
        restrict: 'E',
        link: function (scope, element, attrs, controller) {
          memory.get('videoModel') && (scope.player = memory.get('videoModel'));

          element.on('$destroy', function () {
            memory.set('videoModel', scope.player);
          });
        }
      };
    }]);
})(angular);