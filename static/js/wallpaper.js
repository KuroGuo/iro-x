;(function (angular) { 'use strict';
  angular.module('iro.wallpaper', ['iro.services.wallpaper', 'iro.services.navbar'])
    .controller('WallpaperCtrl', ['$scope', 'wallpaper', 'navbar', '$window', '$document',
      function ($scope, wallpaper, navbar, $window, $document) {
        $scope.wallpapers = wallpaper.query();

        $scope.liHeight = '16rem';
        $window.addEventListener('resize', function () {
          $scope.$apply(rewidth);
        });
        rewidth.call($window);

        navbar.customBackgroundColor = 'rgba(51,51,51,1)';
        $scope.$on('$destroy', function () {
          $window.removeEventListener('resize', onResize);
          navbar.customBackgroundColor = null;
        });

        function rewidth() {
          var rootFontSize = parseFloat($document.find('html').css('font-size'));
          $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';
        }
      }]);
})(angular);