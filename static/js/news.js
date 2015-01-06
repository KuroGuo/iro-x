;(function (angular) { 'use strict';
  angular.module('iro.news', [
    'iro.services.news', 
    'iro.services.navbar',
    'ngSanitize',
    'kScroll',
    'kSwipe',
    'once'])
    .controller('NewsCtrl', ['$scope', 'navbar', function ($scope, navbar) {
      $scope.newsModel = {
        currentNewsId: null,
        newsList: null,
        startId: null,
        listModels: {},
        viewName: null,
        fromView: null,
        toView: null
      };

      navbar.customBackgroundColor = 'rgba(51,51,51,1)';
      $scope.$on('$destroy', function () {
        navbar.customBackgroundColor = null;
      });

       $scope.$on('$stateChangeStart', function () {
        $scope.newsModel.fromView = null;
        $scope.newsModel.toView = null;
       });

      $scope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams) {
        if (toState.name === 'news' && fromState.name === 'news' && (toParams.startid > fromParams.startid || !toParams.startid)
          || toState.name === 'news' && fromState.name.indexOf('news') === 0 && fromState.name !== 'news') {
          document.documentElement.classList.add('state-back');
        } else {
          document.documentElement.classList.remove('state-back');
        }
      });
    }])
    .controller('NewsListCtrl', ['$scope', '$stateParams', 'News', '$window', '$document', '$state', '$timeout',
    function ($scope, $stateParams, News, $window, $document, $state, $timeout) {
      if ($stateParams.startid !== $scope.newsModel.startId) {
        loadData($stateParams.startid, function () {
          $scope.newsModel.startId = $stateParams.startid;
        });
      }

      $scope.openNews = openNews;
      $scope.loadData = loadData;
      $scope.toNextPage = toNextPage;
      $scope.toPage = toPage;

      var listModel;

      if (!$scope.newsModel.listModels[$stateParams.startid]) {
        $scope.listModel = listModel = {
          newsListScroller: {
            usePullUp: true,
            usePullDown: true,
            currentScrollTop: 0
          }
        };
      } else {
        $scope.listModel = listModel = $scope.newsModel.listModels[$stateParams.startid];
      }

      $scope.global.title = '资讯';

      $scope.liHeight = '16rem';
      $window.addEventListener('resize', applyRewidth);
      rewidth.call($window);

      $scope.$on('$destroy', function () {
        $window.removeEventListener('resize', applyRewidth);

        if (listModel.newsListScroller.currentScrollTop < 0)
          listModel.newsListScroller.currentScrollTop = 0;
        else if (listModel.newsListScroller.currentScrollTop > listModel.newsListScroller.maxScroll)
          listModel.newsListScroller.currentScrollTop = listModel.newsListScroller.maxScroll;

        $scope.newsModel.listModels[$stateParams.startid] = listModel;
      });

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
          toPage();
        } else {
          loadData(function () {
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
        toNextPage();
      });

      function openNews(id) {
        if ($state.is('news.detail')) {
          $state.go('news.detail', {id: id}, {location: 'replace'});
        } else {
          $state.go('news.detail', {id: id});
        }
      }

      function loadData(startId, callback) {
        if (typeof startId === 'function') {
          callback = startId;
          startId = null;
        }

       if (!startId && !$scope.newsModel.startId) {
         News.pageQuery({startId: startId}, function (newsList) {
           $scope.newsModel.newsList = newsList;
           if (typeof callback === 'function')
             callback.call(this, newsList);
         });
       } else {
         $scope.newsModel.newsList = News.pageQuery({startId: startId}, function (newsList) {
           if (typeof callback === 'function')
             callback.call(this, newsList);
         });
       }
      }

      function toNextPage() {
        toPage($scope.newsModel.newsList[$scope.newsModel.newsList.length - 1]._id);
      }

      function toPage(startId) {
        $state.go('news', {startid: startId});
      }

      function applyRewidth() {
        rewidth();
        $scope.$digest();
      }

      function rewidth() {
        var rootFontSize = parseFloat($document.find('html').css('font-size'));
        $scope.liWidth = 100 / Math.round($window.innerWidth / rootFontSize / (parseFloat($scope.liHeight) * 16 / 9)) + '%';  
      }
    }])
    .controller('NewsDetailCtrl', ['$scope', 'News', '$stateParams', '$document',
    function ($scope, News, $stateParams, $document) {
      var document = $document[0];

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

      $scope.isTouchScreen = 'ontouchstart' in document;
      $scope.newsDetailScroller = {
        emitDragstart: true,
        mouseDrag: false
      };
      $scope.disableMouseDrag = true;

      $scope.newsModel.currentNewsId = $stateParams.id;

      var dragStartPageX, preventClick;

      document.addEventListener('mousedown', restorePreventClick, true);

      $scope.$on('kScrollerDragstart', function (e, drag) {
        if (Math.abs(drag.deltaX / drag.deltaY) > 1) {
          dragStartPageX = drag.pageX;
          drag.prevent();
        }

        preventClick = true;
      });

      $scope.$on('$destroy', function () {
        $scope.global.title = oldTitle;
        $scope.newsModel.currentNewsId = null;

        document.removeEventListener('mousedown', restorePreventClick, true);
      });

      if (!$scope.isTouchScreen) {
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('mousedown', preventDefault, true);
        document.addEventListener('click', preventDefault, true);
        $scope.$on('$destroy', function () {
          document.removeEventListener('keydown', onKeydown);
          document.removeEventListener('mousedown', preventDefault, true);
          document.removeEventListener('click', preventDefault, true);
        });
      }

      function onKeydown(e) {
        if (e.keyCode === 17) { // ctrl key
          $scope.disableMouseDrag = !$scope.disableMouseDrag;
          $scope.newsDetailScroller.mouseDrag = !$scope.disableMouseDrag;
        }
      }

      function preventDefault(e) {
        switch (e.type) {
          case 'mousedown':
            if (!$scope.disableMouseDrag) {
              e.preventDefault();
            }
            break;
          case 'click':
            if (preventClick) {
              e.preventDefault();
            }
            break;
        }
      }

      function restorePreventClick() {
        preventClick = false;
      }
    }]);
})(angular);
