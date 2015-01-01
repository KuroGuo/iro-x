;(function (angular) { 'use strict';
  angular.module('iro.news', [
    'iro.services.news', 
    'iro.services.navbar',
    'ngSanitize',
    'kScroll',
    'kSwipe'])
    .controller('NewsBaseCtrl', [function () {
      
    }])
    .controller('NewsCtrl',
    ['$scope', 'News', 'navbar', '$state', '$document', '$window', '$timeout', '$stateParams',
    function ($scope, News, navbar, $state, $document, $window, $timeout, $stateParams) {
      $scope.openNews = function (id) {
        if ($state.is('news.detail')) {
          $state.go('news.detail', {id: id}, {location: 'replace'});
        } else {
          $state.go('news.detail', {id: id});
        }
      };

      $scope.loadData = function(startId, callback) {
        if (typeof startId === 'function') {
          callback = startId;
          startId = null;
        }
        News.pageQuery({startId: startId}, function (newsList) {
          $scope.newsModel.newsList = newsList;
          if (typeof callback === 'function')
            callback.call(this, newsList);
        });
      };

      $scope.toNextPage = function() {
        $scope.toPage($scope.newsModel.newsList[$scope.newsModel.newsList.length - 1]._id);
      };

      $scope.toPage = function(startId) {
        $state.go('news', {startid: startId});
      };

      $scope.newsModel = {
        currentNewsId: null,
        newsList: null,
        startId: null
      };

      navbar.customBackgroundColor = 'rgba(51,51,51,1)';
      $scope.$on('$destroy', function () {
        navbar.customBackgroundColor = null;
      });

      $scope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams) {
        if (toState.name === 'news' && fromState.name === 'news' && (toParams.startid > fromParams.startid || !toParams.startid)
          || toState.name === 'news' && fromState.name.indexOf('news') !== 0) {
          $scope.isStateBack = true;
        } else {
          $scope.isStateBack = false;
        }
      });

      $scope.newsListScroller = {
        usePullUp: true,
        usePullDown: true
      };

      $scope.$on('kScrollerPullDownStateChange', function (e) {
        var scroller = e.targetScope.model;
        
        switch (scroller.pullDownState) {
          case 0:
            if ($scope.newsModel.startId) {
              scroller.setPullDownHintText('下拉返回第一页');
            } else {
              scroller.setPullDownHintText('下拉刷新');
            }
            break;
          case 1:
            if ($scope.newsModel.startId) {
              scroller.setPullDownHintText('松开返回第一页');
            } else {
              scroller.setPullDownHintText('松开立即刷新');
            }
            break;
          case 2:
            if ($scope.newsModel.startId) {
              scroller.setPullDownHintText('正在加载第一页…');
            } else {
              scroller.setPullDownHintText('正在刷新...');
            }
            break;
          case 3:
          case 4:
            scroller.setPullDownHintText('刷新完成');
            break;
        }
      });
      $scope.$on('kScrollerPullUpStateChange', function (e) {
        var scroller = e.targetScope.model;

        switch (scroller.pullUpState) {
          case 0:
            scroller.setPullUpHintText('上拉加载下一页');
            break;
          case 1:
            scroller.setPullUpHintText('松开加载下一页');
            break;
          case 2:
            scroller.setPullUpHintText('正在加载...');
            break;
        }
      });
      $scope.$on('kScrollerPullDown', function (e) {
        var targetScope = e.targetScope;
        var scroller = targetScope.model;

        if ($scope.newsModel.startId) {
          $scope.toPage();
        } else {
          $scope.loadData(function () {
            scroller.pullDownState = 3;
            targetScope.$emit('kScrollerPullDownStateChange');
            if (!$scope.newsModel.startId) {
              $timeout(function () {
                scroller.pullDownState = 4;
                targetScope.$emit('kScrollerPullDownStateChange');
                scroller.stopAnimation();
                scroller.scrollTo(0, true, true, 250, function () {
                  scroller.pullDownState = 0;
                  targetScope.$emit('kScrollerPullDownStateChange');
                });
              }, 1500);
            }
          });
        }
      });
      $scope.$on('kScrollerPullUp', function () {
        $scope.toNextPage();
      });

      $scope.liHeight = '16rem';
      $window.addEventListener('resize', applyRewidth);
      rewidth.call($window);

      $scope.$on('$destroy', function () {
        $window.removeEventListener('resize', applyRewidth);
      });

      $scope.global.title = '资讯';

      function applyRewidth() {
        rewidth();
        $scope.$digest();
      }

      function rewidth() {
        var rootFontSize = parseFloat($document.find('html').css('font-size'));
        $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';  
      }
    }])
    .controller('NewsListCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {
      if ($stateParams.startid !== $scope.newsModel.startId) {
        $scope.loadData($stateParams.startid, function () {
          $scope.newsModel.startId = $stateParams.startid;  
        });
      }
    }])
    .controller('NewsDetailCtrl', ['$scope', 'News', '$stateParams', '$document',
    function ($scope, News, $stateParams, $document) {
      var oldTitle = $scope.global.title;

      if ($scope.newsModel.newsList && $scope.newsModel.newsList.some(function (news) {
        return news._id === $stateParams.id;
      })) {
        $scope.news = $scope.newsModel.newsList.filter(function (news) {
          return news._id === $stateParams.id;
        })[0];
        $scope.global.title = $scope.news.title + ' - 资讯';
      } else {
        News.get({id: $stateParams.id}, function (news) {
          $scope.news = news;
          $scope.global.title = news.title + ' - 资讯';
        });
      }

      $scope.newsDetailScroller = {
        emitDragstart: true,
        mouseDrag: false
      };

      var dragStartPageX;

      $scope.$on('kScrollerDragstart', function (e, drag) {
        if (Math.abs(drag.deltaX / drag.deltaY) > 3 / 4) {
          drag.prevent();
          dragStartPageX = drag.pageX;
        }
      });

      $scope.$on('$destroy', function () {
        $scope.global.title = oldTitle;
        $scope.newsModel.currentNewsId = null;
      });

      $scope.newsModel.currentNewsId = $stateParams.id;
    }]);
})(angular);