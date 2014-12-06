;(function (angular) { 'use strict';
  angular.module('iro.wallpaper', ['iro.services.wallpaper', 'iro.services.navbar', 'kScroll'])
    .controller('WallpaperCtrl', ['$scope', 'Wallpaper', 'navbar', '$window', '$document',
      function ($scope, Wallpaper, navbar, $window, $document) {
        $scope.wallpapers = Wallpaper.query();

        $scope.liHeight = '16rem';
        $window.addEventListener('resize', applyRewidth);
        rewidth.call($window);

        navbar.customBackgroundColor = 'rgba(51,51,51,1)';
        $scope.$on('$destroy', function () {
          $window.removeEventListener('resize', applyRewidth);
          navbar.customBackgroundColor = null;
        });

        function applyRewidth() {
          $scope.$apply(rewidth);
        }

        function rewidth() {
          var rootFontSize = parseFloat($document.find('html').css('font-size'));
          $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';  
        }
      }]);
})(angular);