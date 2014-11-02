;(function (angular) { 'use strict';
    angular.module('blog_k.music', ['blog_k.services.music'])
        .factory('musicPlayer', ['music', function (music) {
            var musicPlayer = {
                audio: document.createElement('audio'),
                list: null
            };

            musicPlayer.loadAllToList = function () {
                musicPlayer.list = music.query();
            };

            musicPlayer.play = function (music) {
                musicPlayer.audio.src = music.path;
                musicPlayer.audio.play();
            };

            return musicPlayer;
        }])
        .controller('MusicCtrl', ['$scope', 'musicPlayer', function ($scope, musicPlayer) {
            if (!musicPlayer.list) {
                musicPlayer.loadAllToList();
            }
            $scope.musics = musicPlayer.list;

            $scope.play = function (music) {
                musicPlayer.play(music);
                $scope.title = music.name;
            };

            musicPlayer.audio.addEventListener('play', checkPaused);
            musicPlayer.audio.addEventListener('pause', checkPaused);

            function checkPaused() {
                $scope.$apply(function () {
                    $scope.paused = musicPlayer.audio.paused;
                });
            }
        }])
        .directive('blogKMusic', ['musicPlayer', function (musicPlayer) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, controller) {
                }
            };
        }]);
})(angular);