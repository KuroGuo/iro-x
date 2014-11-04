;(function (angular) { 'use strict';
    angular.module('blog_k.music', ['blog_k.services.music', 'cfp.loadingBar'])
        .factory('musicPlayer', ['music', 'cfpLoadingBar', '$http', function (music, cfpLoadingBar, $http) {
            var audio = document.createElement('audio', 'cfpLoadingBar');
            var currentMusic = null;

            var musicPlayer = {
                list: null, // 播放列表， 类型：[{name: String, path: String}]
                lrcList: null, // 歌词列表，类型：[{time: Number, content: String}],
                currentLrc: null // 当前歌词，类型：{time: Number, content: String}
            };

            audio.addEventListener('loadstart', function () {
                cfpLoadingBar.start();
                musicPlayer.currentLrc = null;
            });
            audio.addEventListener('canplay', function () {
                cfpLoadingBar.complete();
            });
            audio.addEventListener('timeupdate', function (e) {
                var audio = e.currentTarget;
                var i;
                if (musicPlayer.lrcList) {
                    for (i = 0; i < musicPlayer.lrcList.length; i++) {
                        if (musicPlayer.lrcList[i].time > audio.currentTime)
                            break;
                    }
                    musicPlayer.currentLrc = musicPlayer.lrcList[i - 1];
                }
            });

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
                    $http({
                        method: 'GET',
                        url: currentMusic.path.replace(/\.mp3$/, '.lrc'),
                        responseType: 'blob'
                    }).success(function (blob) {
                        var fr = new FileReader();
                        fr.onload = function () {
                            musicPlayer.lrcList = this.result.replace(/\r/g, '').split('\n').map(function (lrc) {
                                var matched = lrc.match(/^\[(\d\d)\:(\d\d\.\d\d)\](.*)$/);
                                if (matched) {
                                    return {
                                        time: parseFloat(matched[1]) * 60 + parseFloat(matched[2]),
                                        content: matched[3]
                                    };
                                }
                            }).filter(function (lrc) {
                                return lrc;
                            });
                        };
                        fr.readAsText(blob);
                    });
                }
            });

            musicPlayer.on = function (eventName, handler) {
                audio.addEventListener(eventName, handler);
            };

            musicPlayer.off = function (eventName, handler) {
                audio.removeEventListener(eventName, handler);
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
        .controller('MusicCtrl', ['$scope', 'musicPlayer', function ($scope, musicPlayer) {
            if (!musicPlayer.list) {
                musicPlayer.loadAllToList(function () {
                    this.play(0);
                });
            }

            Object.defineProperty($scope, 'musics', {
                get: function () {
                    return musicPlayer.list;
                }
            });

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

            Object.defineProperty($scope, 'lrcList', {
                get: function () {
                    return musicPlayer.lrcList;
                }
            });

            Object.defineProperty($scope, 'currentLrc', {
                get: function () {
                    return musicPlayer.currentLrc;
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

            musicPlayer.on('timeupdate', apply);

            $scope.$on("$destroy", function(){
                musicPlayer.off('timeupdate', apply);
            });

            function apply() {
                $scope.$apply();
            }
        }]);
})(angular);