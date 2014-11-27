;(function (angular) { 'use strict';
  angular.module('iro.wallpaper', ['iro.services.wallpaper'])
    .controller('WallpaperCtrl', ['$scope', 'wallpaper', function ($scope, wallpaper) {
      $scope.wallpapers = wallpaper.query();
    }]);
})(angular);