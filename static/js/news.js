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
    .controller('NewsCtrl', ['$scope', 'News', 'navbar', 'news', '$state', '$document', '$window', '$timeout',
    function ($scope, News, navbar, news, $state, $document, $window, $timeout) {
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

      $scope.$on('kScrollerDrag', function () {
        var currentScrollTop = $scope.newsListScroller.currentScrollTop;
        if (currentScrollTop < -4 && (!$scope.refreshState || $scope.refreshState === 4)) {
          $scope.refreshState = 1;
          $scope.$digest();
        } else if (currentScrollTop > $scope.newsListScroller.maxScroll + 4 && (!$scope.toNextPageState || $scope.toNextPageState === 4)) {
          $scope.toNextPageState = 1;
          $scope.$digest();
        }
      });
      $scope.$on('kScrollerDragend', function () {
        var currentScrollTop = $scope.newsListScroller.currentScrollTop;
        if (currentScrollTop < -4 && $scope.refreshState < 2) {
          $scope.refreshState = 2;
          $scope.$digest();
          $scope.newsListScroller.stopAnimation();
          $scope.newsListScroller.scrollTo(-4, true, true, 250, function () {
            loadData(function () {
              $scope.refreshState = 3;
              $timeout(function () {
                $scope.refreshState = 4;
                $scope.newsListScroller.stopAnimation();
                $scope.newsListScroller.scrollTo(0, true, true, 250, function () {
                  $scope.refreshState = 0;
                  $scope.$digest();
                });
              }, 1500);
            });
          });
        } else if (currentScrollTop > $scope.newsListScroller.maxScroll + 4 && $scope.toNextPageState < 2) {
          var maxScroll = $scope.newsListScroller.maxScroll;
          $scope.toNextPageState = 2;
          $scope.$digest();
          $scope.newsListScroller.stopAnimation();
          $scope.newsListScroller.scrollTo(maxScroll + 4, true, true, 250, function () {
            loadNextPageData(function () {
              $scope.toNextPageState = 0;
              $scope.newsListScroller.scrollTo(0);
            });
          });
        }
      });

      loadData();

      function applyRewidth() {
        rewidth();
        $scope.$digest();
      }

      function rewidth() {
        var rootFontSize = parseFloat($document.find('html').css('font-size'));
        $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';  
      }

      function loadData(callback) {
        News.pageQuery(function (newsList) {
           $scope.newsList = newsList;
           if (typeof callback === 'function')
            callback.call(this, newsList);
        });
      }

      function loadNextPageData(callback) {
        News.pageQuery({startId: $scope.newsList[$scope.newsList.length - 1]._id}, function (newsList) {
          $scope.newsList = newsList;
          if (typeof callback === 'function')
            callback.call(this, newsList);
        });
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

      $scope.scroller = {
        mouseDrag: false
      };

      news.currentNewsId = $stateParams.id;
    }]);
})(angular);