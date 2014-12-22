;(function (angular) { 'use strict';
  angular.module('iro.news', [
    'iro.services.news', 
    'iro.services.navbar',
    'ngSanitize',
    'kScroll'])
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
    .controller('NewsCtrl', ['$state', '$scope', '$document', function ($state, $scope, $document) {
      $scope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams) {
        if (toState.name === fromState.name && (toParams.startid > fromParams.startid || !toParams.startid)
          || fromState.name === 'news.detail' && toState.name === 'news.list') {
          $document.find('html').addClass('state-back');
        } else {
          $document.find('html').removeClass('state-back');
        }
      });

      if ($state.is('news')) {
        $state.go('news.list');
      }
    }])
    .controller('NewsListCtrl',
    ['$scope', 'News', 'navbar', 'news', '$state', '$document', '$window', '$timeout', '$stateParams',
    function ($scope, News, navbar, news, $state, $document, $window, $timeout, $stateParams) {
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

      $scope.newsListScroller = {
        usePullUp: true,
        usePullDown: true
      };

      $scope.$on('kScrollerPullDownStateChange', function () {
        switch ($scope.newsListScroller.pullDownState) {
          case 0:
            $scope.newsListScroller.setPullDownHintText('下拉刷新');
            break;
          case 1:
            $scope.newsListScroller.setPullDownHintText('松开立即刷新');
            break;
          case 2:
            $scope.newsListScroller.setPullDownHintText('正在刷新...');
            break;
          case 3:
          case 4:
            $scope.newsListScroller.setPullDownHintText('刷新完成');
            break;
        }
      });
      $scope.$on('kScrollerPullUpStateChange', function () {
        switch ($scope.newsListScroller.pullUpState) {
          case 0:
            $scope.newsListScroller.setPullUpHintText('上拉加载下一页');
            break;
          case 1:
            $scope.newsListScroller.setPullUpHintText('松开加载下一页');
            break;
          case 2:
            $scope.newsListScroller.setPullUpHintText('正在加载...');
            break;
        }
      });
      $scope.$on('kScrollerPullDown', function () {
        if ($stateParams.startid) {
          toPage();
        } else {
          loadData(function () {
            $scope.newsListScroller.pullDownState = 3;
            $scope.$emit('kScrollerPullDownStateChange');
            $timeout(function () {
              $scope.newsListScroller.pullDownState = 4;
              $scope.$emit('kScrollerPullDownStateChange');
              $scope.newsListScroller.stopAnimation();
              $scope.newsListScroller.scrollTo(0, true, true, 250, function () {
                $scope.newsListScroller.pullDownState = 0;
                $scope.$emit('kScrollerPullDownStateChange');
              });
            }, 1500);
          });
        }
      });
      $scope.$on('kScrollerPullUp', function () {
        toNextPage();
      });

      loadData($stateParams.startid);

      function applyRewidth() {
        rewidth();
        $scope.$digest();
      }

      function rewidth() {
        var rootFontSize = parseFloat($document.find('html').css('font-size'));
        $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';  
      }

      function loadData(startId, callback) {
        if (typeof startId === 'function') {
          callback = startId;
          startId = null;
        }
        News.pageQuery({startId: startId}, function (newsList) {
           $scope.newsList = newsList;
           if (typeof callback === 'function')
            callback.call(this, newsList);
        });
      }

      function toPage(startId) {
        $state.go($state.$current, {startid: startId});
      }

      function toNextPage() {
        toPage($scope.newsList[$scope.newsList.length - 1]._id);
      }
    }])
    .controller('NewsDetailCtrl', ['$scope', 'News', '$stateParams', 'news', '$document',
    function ($scope, News, $stateParams, news, $document) {
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