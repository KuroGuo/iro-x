;(function (angular) { 'use strict';
  angular.module('iro.wallpaper', ['iro.services.wallpaper', 'iro.services.navbar'])
    .controller('WallpaperCtrl', ['$scope', 'wallpaper', 'navbar', function ($scope, wallpaper, navbar) {
      $scope.wallpapers = wallpaper.query();
      navbar.customBackgroundColor = 'rgba(51,51,51,1)';
      $scope.$on('$destroy', function () {
        navbar.customBackgroundColor = null;
      });
    }]);
})(angular);