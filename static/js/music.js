;(function (angular) { 'use strict';
    angular.module('blog_k.music', ['blog_k.services.music', 'cfp.loadingBar'])
        .factory('musicPlayer', ['music', function (music) {
            var audio = document.createElement('audio');
            var currentMusic = null;

            var musicPlayer = {
                list: null
            };

            Object.defineProperty(musicPlayer, 'paused', {
                get: function () {
                    return audio.paused;
                },
                set: function (newValue) {
                    audio.paused = newValue;
                }
            });

            Object.defineProperty(musicPlayer, 'currentMusic', {
                get: function () {
                    return currentMusic;
                },
                set: function (music) {
                    audio.src = music.path;
                    currentMusic = music;
                }
            });

            musicPlayer.on = function (eventName, handler) {
                audio.addEventListener(eventName, handler);
            };

            musicPlayer.loadAllToList = function (callback) {
                var _this = this;
                this.list = music.query(function (list) {
                    var i, j, temp;

                    for (i = 0; i < list.length - 1; i++) {
                        j = Math.floor(i + 1 + Math.random() * (list.length - i - 1));
                        temp = list[i];
                        list[i] = list[j];
                        list[j] = temp;
                    }

                    if (typeof callback === 'function')
                        callback.call(_this, _this.list);
                });
            };

            musicPlayer.play = function (musicOrIndex) {
                var music;

                if (typeof musicOrIndex === 'number') {
                    if (musicOrIndex < 0) {
                        musicOrIndex = this.list.length - 1;
                    } else if (musicOrIndex >= this.list.length) {
                        musicOrIndex = 0;
                    }
                    music = this.list[musicOrIndex];
                } else {
                    music = musicOrIndex;
                }

                if (music && music !== currentMusic) {
                    this.currentMusic = music;
                }

                audio.play();
            };

            musicPlayer.pause = function () {
                audio.pause();
            };

            musicPlayer.pre = function () {
                this.play(getCurrentMusicIndex() - 1);
            };

            musicPlayer.next = function () {
                this.play(getCurrentMusicIndex() + 1);
            };

            function getCurrentMusicIndex () {
                var i;
                for (i = 0; i < musicPlayer.list.length; i++) {
                    if (musicPlayer.list[i].name === musicPlayer.currentMusic.name) {
                        return i;
                    }
                }
            }

            return musicPlayer;
        }])
        .controller('MusicCtrl', ['$scope', 'musicPlayer', 'cfpLoadingBar',
        function ($scope, musicPlayer, cfpLoadingBar) {
            if (!musicPlayer.list) {
                musicPlayer.loadAllToList(function () {
                    this.play(0);
                });
            }
            $scope.musics = musicPlayer.list;

            Object.defineProperty($scope, 'currentMusic', {
                get: function () {
                    return musicPlayer.currentMusic;
                },
                set: function (music) {
                    musicPlayer.play(music);
                }
            });

            Object.defineProperty($scope, 'paused', {
                get: function () {
                    return musicPlayer.paused;
                },
                set: function (newValue) {
                    musicPlayer.paused = newValue;
                }
            });

            $scope.play = function (musicOrIndex) {
                musicPlayer.play(musicOrIndex);
            };

            $scope.pause = function () {
                musicPlayer.pause();
            };

            $scope.pre = function () {
                musicPlayer.pre();
            };

            $scope.next = function () {
                musicPlayer.next();
            };

            musicPlayer.on('loadstart', function () {
                cfpLoadingBar.start();
            });
            musicPlayer.on('canplay', function () {
                cfpLoadingBar.complete();
            });
        }])
        .directive('blogKMusic', ['musicPlayer', function (musicPlayer) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, controller) {
                }
            };
        }]);
})(angular);