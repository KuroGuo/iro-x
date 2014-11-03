;(function (angular) { 'use strict';
    angular.module('blog_k', [
        'kTap',
        'kDrag',
        'kScroll',
        'ngAnimate',
        'angular-loading-bar',
        'ui.router',
        'blog_k.home',
        'blog_k.video',
        'blog_k.music',
        'blog_k.services.member'
    ]).config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: '/static/partials/home.html',
                controller: 'HomeCtrl'
            })
            .state('video', {
                url: '/video',
                templateUrl: '/static/partials/video.html',
                controller: 'VideoCtrl'
            })
            .state('music', {
                url: '/music',
                templateUrl: '/static/partials/music.html',
                controller: 'MusicCtrl'
            })
            .state('article', {
                url: '/article',
                template: 'article'
            })
            .state('wallpaper', {
                url: '/wallpaper',
                template: 'wallpaper'
            })
            .state('admin.login', {
                url: '/admin/login',
                template: '<k-login id="login"></k-login>',
                controller: 'LoginCtrl'
            })
            .state('register', {
                url: '/register',
                templateUrl: '/static/partials/register.html'
            });

        $urlRouterProvider
            .otherwise('/');

        $locationProvider.html5Mode(true).hashPrefix('!');
    }]).controller('MainCtrl', ['$scope' ,'$state', 'member', function ($scope ,$state, member) {
        $scope.setUser = function (user) {
            if ($scope.$$phase) {
                $scope.user = user; 
            } else {
                $scope.$apply(function () {
                    $scope.user = user;    
                });
            }
        };

        $scope.stateGo = function (sref) {
            $state.go(sref);
        };

        member.checkOnline(function (err, user) {
            $scope.setUser(user);
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

                $($window).on('resize', function () {
                    if ($window.innerWidth >= $window.innerHeight) {
                        $('html').removeClass('high-screen').addClass('wide-screen');
                    } else {
                        $('html').removeClass('wide-screen').addClass('high-screen');
                    }
                    if ($('html').hasClass('ipad ios7')) {
                        $('body').height(window.innerHeight);
                    }
                }).triggerHandler('resize');

                var wallpaperSrc = '/static/images/wallpaper.jpg';

                $.ajax({
                    type: 'GET',
                    url: wallpaperSrc,
                    xhr: function () {
                        var xhr = $.ajaxSettings.xhr();
                        xhr.addEventListener('progress', function (e) {
                            var percent = e.loaded / e.total;

                            $('#loading_cover .progress-bar').css('width', (percent * 100) + '%');
                            if (percent === 1) {
                                $('body').css('background-image', 'url(' + wallpaperSrc + ')');
                                $timeout(function () {
                                    scope.loaded = true;
                                }, 800);
                            }
                        });
                        return xhr;
                    }
                });

                function bindEvents() {
                    $(document)
                        .on('dragstart', function (e) {
                            e.preventDefault();
                        })
                        .on('touchmove', function (e) {
                            e.preventDefault();
                        })
                        .on('mouseenter', '*', function (e) {
                            e.preventDefault();
                            $(e.currentTarget).addClass('hover');
                        })
                        .on('mouseleave touchstart', '*', function (e) {
                            $(e.currentTarget).removeClass('hover');
                        })
                        .on('touchstart mousedown', '*', function (e) {
                            $(e.currentTarget).addClass('active');
                        })
                        .on('touchend touchcancel mouseup mouseleave', '*', function (e) {
                            $(e.currentTarget).removeClass('active');
                        })
                        // .on('touchstart touchend touchmove click tap mousedown mouseup', function (e) {
                        //     $('.container').append(e.type + '<br />');
                        // })
                        .on('ktap', 'a', function (e) {
                            if (e.pointerType === 'touch' && $(e.currentTarget).attr('href')) {
                                $(e.currentTarget).trigger('click');
                            }
                        })
                        .on('touchstart touchend', function (e) {
                            if ($(e.target).is('input[type="text"], textarea, [contenteditable]')) {
                                return;
                            }
                            e.preventDefault();
                        });
                }
            }
        };
    }]);
})(angular);