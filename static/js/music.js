;(function (angular) { 'use strict';
  angular.module('iro.music', ['iro.services.music', 'cfp.loadingBar', 'kScroll'])
    .factory('musicPlayer', ['music', 'cfpLoadingBar', '$http', '$window', function (music, cfpLoadingBar, $http, $window) {
      var audio = document.createElement('audio');
      var currentMusic = null;

      var watcher = {
        currentLrcChanged: [],
        currentMusicChanged: []
      };

      var musicPlayer = {
        list: null, // 播放列表， 类型：[{name: String, src: String, lrcUrl: String, bgSrc: String}]
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
          if (musicPlayer.currentLrc !== musicPlayer.lrcList[i - 1]) {
            musicPlayer.currentLrc = musicPlayer.lrcList[i - 1];
            emit('currentLrcChanged');
          }
        }
      });
      audio.addEventListener('ended', function () {
        musicPlayer.next();
      });

      Object.defineProperty(musicPlayer, 'paused', {
        get: function () {
          return audio.paused;
        },
        set: function (newValue) {
          audio.paused = newValue;
        }
      });

      Object.defineProperty(musicPlayer, 'currentTime', {
        get: function () {
          return audio.currentTime;
        },
        set: function (newValue) {
          audio.currentTime = newValue;
        }
      });

      Object.defineProperty(musicPlayer, 'duration', {
        get: function () {
          return audio.duration;
        },
        set: function () {
          audio.duration = duration;
        }
      });

      Object.defineProperty(musicPlayer, 'currentMusic', {
        get: function () {
          return currentMusic;
        },
        set: function (music) {
          audio.src = music.src;
          if (!currentMusic || currentMusic.name !== music.name) {
            currentMusic = music;
            emit('currentMusicChanged');
          }
          musicPlayer.lrcList = null;
          if (music.lrcUrl) {
            $http({
              method: 'GET',
              url: music.lrcUrl,
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
        }
      });

      musicPlayer.on = function (eventName, handler) {
        if (!watcher[eventName])
          throw new Error('没有这个事件观察者');

        watcher[eventName].push(handler);
      };

      musicPlayer.off = function (eventName, handler) {
        if (!watcher[eventName])
          return;

        if (!(watcher[eventName] instanceof Array))
          throw new Error('watcher不是数组');

        var i;

        for(i = 0; i < watcher[eventName].length; i++) {
          if (watcher[eventName][i] === handler) {
            watcher[eventName].splice(i);
            return;
          }
        }
      };

      musicPlayer.loadAllToList = function (callback) {
        var _this = this;
        _this.list = music.query(function (list) {
          var i, j, temp;

          for (i = 0; i < list.length; i++) {
            j = Math.floor(Math.random() * list.length);
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
        } else if (typeof musicOrIndex === 'string') {
          music = this.list.filter(function (music) {
            return music.name === musicOrIndex;
          })[0];
          if (!music)
            music = this.list[0];
        } else if (musicOrIndex && 'name' in musicOrIndex) {
          music = musicOrIndex;
        }

        if (music && (!this.currentMusic || music.name !== this.currentMusic.name)) {
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

      function getCurrentMusicIndex() {
        var i;
        for (i = 0; i < musicPlayer.list.length; i++) {
          if (musicPlayer.list[i].name === musicPlayer.currentMusic.name) {
            return i;
          }
        }
      }

      function emit(eventName) {
        if (!watcher[eventName])
          return

        if (!(watcher[eventName] instanceof Array))
          throw new Error('watcher不是数组');

        watcher[eventName].forEach(function (handler) {
          handler.call(musicPlayer);
        });
      }

      return musicPlayer;
    }])
    .controller('MusicCtrl', ['$scope', 'musicPlayer', '$state',
      function ($scope, musicPlayer, $state) {
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

      Object.defineProperty($scope, 'currentTime', {
        get: function () {
          return musicPlayer.currentTime;
        },
        set: function (newValue) {
          musicPlayer.currentTime = newValue;
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

      musicPlayer.on('currentLrcChanged', apply);
      musicPlayer.on('currentMusicChanged', gotoMusicPlay);

      $scope.$on('$destroy', function () {
        musicPlayer.off('currentLrcChanged', apply);
        musicPlayer.off('currentMusicChanged', gotoMusicPlay);
      });

      if ($state.is('music')) {
        if (!musicPlayer.list) {
          musicPlayer.loadAllToList(function (list) {
            $state.go('music.play');
          });
        } else {
          $state.go('music.play', {name: musicPlayer.currentMusic.name});
        }
      }

      $scope.musiclistScroller = {
        currentScrollTop: 0
      };

      function apply() {
        $scope.$apply();
      }

      function gotoMusicPlay() {
        $state.go('music.play', {name: musicPlayer.currentMusic.name}, {location: 'replace'});
      }
    }])
    .controller('MusicPlayCtrl', ['$stateParams', 'musicPlayer', function ($stateParams, musicPlayer) {
      if (!musicPlayer.list) {
        musicPlayer.loadAllToList(function (list) {
          play();
        });
      } else {
        play();
      }

      function play() {
        if (!musicPlayer.currentMusic || musicPlayer.currentMusic.name !== $stateParams.name) {
          musicPlayer.play($stateParams.name || 0);
        }
      }
    }]);
})(angular);