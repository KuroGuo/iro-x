;(function (angular) { 'use strict';
  angular.module('iro.news', ['iro.services.news', 'iro.services.navbar', 'ngSanitize'])
    .factory('news', ['$window', function ($window) {
      if (!$window.localStorage['news.visitedArr']) {
        $window.localStorage['news.visitedArr'] = '[]';
      }

      var visited = {
        getArr: function() {
          return JSON.parse($window.localStorage['news.visitedArr']);
        },
        save: function(arr) {
          $window.localStorage['news.visitedArr'] = JSON.stringify(arr);
        },
        exist: function (id) {
          return this.getArr().some(function (newsId) {
            return newsId === id;
          });
        },
        insert: function (id) {
          if (this.exist(id)) {
            return;
          }
          var arr = this.getArr();
          arr.push(id);
          this.save(arr);
        }
      };

      var news = {
        get currentNewsId() {
          return $window.sessionStorage['news.currentNewsId'];
        },
        set currentNewsId(val) {
          $window.sessionStorage['news.currentNewsId'] = val;
          visited.insert(val);
        },
        isVisited: function (id) {
          return visited.exist(id);
        }
      };

      return news;
    }])
    .controller('NewsCtrl', ['$scope', 'News', 'navbar', 'news', '$state', '$document', '$window',
    function ($scope, News, navbar, news, $state, $document, $window) {
      $scope.loadData = function (page) {
        $scope.newsList = News.pageQuery(null, {page: page});
      };

      $scope.openNews = function (id) {
        if ($state.is('news.detail')) {
          $scope.stateGo('news.detail', {id: id}, {location: 'replace'});
        } else {
          $scope.stateGo('news.detail', {id: id});
        }
      };

      Object.defineProperty($scope, 'currentNewsId', {
        get: function () {
          return news.currentNewsId;
        }
      });

      $scope.isVisited = function (newsId) {
        return news.isVisited(newsId);
      };

      Object.defineProperty($scope, 'stateIsDetail', {
        get: function () {
          return $state.is('news.detail');
        }
      });

      $scope.global.title = '资讯';

      $scope.liHeight = '16rem';
      $window.addEventListener('resize', applyRewidth);
      rewidth.call($window);

      navbar.customBackgroundColor = 'rgba(51,51,51,1)';
      $scope.$on('$destroy', function () {
        $window.removeEventListener('resize', applyRewidth);
        navbar.customBackgroundColor = null;
      });

      $scope.loadData();

      function applyRewidth() {
        $scope.$apply(rewidth);
      }

      function rewidth() {
        var rootFontSize = parseFloat($document.find('html').css('font-size'));
        $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';  
      }
    }])
    .controller('NewsDetailCtrl', ['$scope', 'News', '$stateParams', 'news', function ($scope, News, $stateParams, news) {
      var oldTitle = $scope.global.title;
      $scope.news = News.get({id: $stateParams.id}, function (news) {
        $scope.global.title = news.title + ' - 资讯';
      });
      $scope.$on('$destroy', function () {
        $scope.global.title = oldTitle;
      });
      news.currentNewsId = $stateParams.id;
    }]);
})(angular);