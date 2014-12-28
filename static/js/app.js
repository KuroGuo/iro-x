;(function (angular) { 'use strict';
  angular.module('iro', [
    'kTap',
    'ngAnimate',
    'angular-loading-bar',
    'ui.router',
    'iro.home',
    'iro.video',
    'iro.music',
    'iro.wallpaper',
    'iro.news',
    'iro.services.navbar'
  ]).config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '/static/templates/home.html',
        controller: 'HomeCtrl'
      })
      .state('video', {
        url: '/video',
        templateUrl: '/static/templates/video.html',
        controller: 'VideoCtrl'
      })
      .state('music', {
        url: '/music',
        templateUrl: '/static/templates/music/index.html',
        controller: 'MusicCtrl'
      })
      .state('music.play', {
        url: '/:name',
        templateUrl: '/static/templates/music/play.html',
        controller: 'MusicPlayCtrl'
      })
      .state('news', {
        url: '/news?startid',
        templateUrl: '/static/templates/news/index.html',
        controller: 'NewsCtrl'
      })
      .state('news.detail', {
        url: '/:id',
        templateUrl: 'static/templates/news/detail.html',
        controller: 'NewsDetailCtrl'
      })
      .state('article', {
        url: '/article',
        template: 'article'
      })
      .state('wallpaper', {
        url: '/wallpaper',
        templateUrl: '/static/templates/wallpaper/index.html',
        controller: 'WallpaperCtrl'
      })
      .state('vpn', {
        url: '/vpn',
        templateUrl: '/static/templates/vpn.html'
      })
      .state('admin.login', {
        url: '/admin/login',
        template: '<k-login id="login"></k-login>',
        controller: 'LoginCtrl'
      })
      .state('register', {
        url: '/register',
        templateUrl: '/static/templates/register.html'
      });

    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true).hashPrefix('!');
  }]).controller('MainCtrl', ['$scope' ,'$state', 'musicPlayer', '$window', 'navbar',
  function ($scope ,$state, musicPlayer, $window, navbar) {
    $scope.setUser = function (user) {
      if ($scope.$$phase) {
        $scope.user = user; 
      } else {
        $scope.$apply(function () {
          $scope.user = user;    
        });
      }
    };

    $scope.stateGo = function (to, params, options) {
      $state.go(to, params, options);
    };

    $scope.backHistory = function () {
      $window.history.back();
    };

    $scope.openWindow = function (href) {
      $window.open(href);
    };

    $scope.global = {
      get customWallpaperSrc() {
        if (!$state.includes('music') && musicPlayer.paused) {
          return null;
        }
        if (!musicPlayer.currentMusic) {
          return null;
        }
        return musicPlayer.currentMusic.bgSrc;
      },
      title: null
    };

    Object.defineProperty($scope, 'navbarCustomBackgroundColor', {
      get: function () {
        return navbar.customBackgroundColor;
      }
    });
  }]).directive('html', ['$window', '$document', '$state', '$timeout', function ($window, $document, $state, $timeout) {
    var document = $document[0];

    return {
      restrict: 'E',
      link: function (scope, element, attrs, controller) {
        bindEvents();

        scope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState) {
          if (!$state.includes(fromState.name) && fromState.name !== 'home' && !fromState.abstract) {
            element.addClass('state-back');
          } else {
            element.removeClass('state-back');
          }
        });

        // 修复iPad ios7下的高度异常
        if (navigator.userAgent.match(/iPad;.*CPU.*OS 7_\d/i)) {
          $('html').addClass('ipad ios7');
        }

        $($window)
          .on('resize', function () {
            if ($window.innerWidth / $window.innerHeight >= 4 / 3) {
              $('html').removeClass('high-screen').addClass('wide-screen');
            } else {
              $('html').removeClass('wide-screen').addClass('high-screen');
            }
            if ($('html').hasClass('ipad ios7')) {
              $('body').height(window.innerHeight);
            }
          })
          .triggerHandler('resize');

        var wallpaperSrc = '/static/images/wallpaper.jpg';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', wallpaperSrc);
        xhr.responseType = 'blob';
        xhr.onprogress = function (e) {
          var percent = e.loaded / e.total;

          $('#loading_cover .progress-bar').css('width', (percent * 100) + '%');
        };
        xhr.onload = function () {
          $('#loading_cover .progress-bar').css('animation', 'fade-out .8s .4s forwards');
          $window.wallpaperBlob = this.response;
          scope.wallpaperSrc = window.URL.createObjectURL(this.response);
          $timeout(function () {
            scope.loaded = true;
          }, 800);
        };
        xhr.send();

        function bindEvents() {
          var activeTimeoutToken;

          document.addEventListener('dragstart', preventDefault, true);
          document.addEventListener('touchmove', preventDefault, true);

          $document
            .on('mouseenter', '.hoverable', function (e) {
              $(e.currentTarget).addClass('hover');
            })
            .on('mouseleave', '.hoverable', function (e) {
              $(e.currentTarget).removeClass('hover');
            })
            .on('touchstart mousedown', '.activable', function (e) {
              $(e.currentTarget).addClass('active');
            })
            .on('touchmove mousemove', '.k-scroller .activable, .k-slider .activable', function (e) {
              $(e.currentTarget).removeClass('active');
            })
            .on('touchend touchcancel mouseup mouseleave', '.activable', function (e) {
              $(e.currentTarget).removeClass('active');
            })
            .on('mousedown mouseup click touchstart touchend', function (e) {
              if (e.isTrigger === 3) {
                return;
              }

              e.preventDefault();
            });

          function preventDefault(e) {
            e.preventDefault();
          }
        }
      }
    };
  }]).config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }])
  .animation('.slide-animation-right', function () {
    return {
      enter: animateIn,
      leave: animateOut,
      addClass: function (element, className, done) {
        switch (className) {
          case 'ng-hide': {
            animateIn(element, done);
            break;
          }
        }
      },
      removeClass: function (element, className, done) {
        switch (className) {
          case 'ng-hide': {
            animateOut(element, done);
            break;
          }
        }
      }
    };

    function animateIn(element, done) {
      element.velocity('stop');

      var isStateBack = angular.element('html').hasClass('state-back');

      $.Velocity.hook(element, 'translateZ', '1px');

      $.Velocity.hook(element, 'translateX', isStateBack ? '-100%' : '100%');

      element.velocity({
        translateX: 0
      }, {
        duration: 400,
        complete: done
      });
    }

    function animateOut(element, done) {
      element.velocity('stop');

      var isStateBack = angular.element('html').hasClass('state-back');

      $.Velocity.hook(element, 'translateZ', '1px');

      $.Velocity.hook(element, 'translateX', 0);

      element.velocity({
        translateX: isStateBack ? '100%' : '-100%'
      }, {
        duration: 400,
        complete: done
      });
    }
  })
  .animation('.slide-animation-left', function () {
    return {
      enter: animateIn,
      leave: animateOut,
      addClass: function (element, className, done) {
        switch (className) {
          case 'ng-hide': {
            animateIn(element, done);
            break;
          }
        }
      },
      removeClass: function (element, className, done) {
        switch (className) {
          case 'ng-hide': {
            animateOut(element, done);
            break;
          }
        }
      }
    };

    function animateIn(element, done) {
      element.velocity('stop');

      var isStateBack = angular.element('html').hasClass('state-back');

      $.Velocity.hook(element, 'translateZ', '1px');
      $.Velocity.hook(element, 'translateX', isStateBack ? '100%' : '-100%');

      element.velocity({
        translateX: 0
      }, {
        duration: 400,
        complete: done
      });
    }

    function animateOut(element, done) {
      element.velocity('stop');

      var isStateBack = angular.element('html').hasClass('state-back');

      $.Velocity.hook(element, 'translateZ', '1px');
      $.Velocity.hook(element, 'translateX', 0);

      element.velocity({
        translateX: isStateBack ? '100%' : '-100%'
      }, {
        duration: 400,
        complete: done
      });
    }
  })
  .directive('eventStopPropagation', [function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs, controller) {
        if ('onpointerdown' in element[0])
          return;

        var events =  attrs.eventStopPropagation.split(',');
        var i;

        for (i = 0; i < events.length; i++) {
          element[0].addEventListener(events[i], stopPropagation);
        }
      }
    };

    function stopPropagation(e) {
      e.stopPropagation();
    }
  }]);
})(angular);