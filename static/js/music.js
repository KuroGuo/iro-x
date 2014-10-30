;(function (angular) { 'use strict';
    angular.module('blog_k.music', ['blog_k.services.music'])
        .factory('musicPlayer', ['music', function (music) {
            var musicPlayer = {
                audio: document.createElement('audio'),
                list: null
            };

            musicPlayer.loadAllToList = function () {
                list = music.query();
            };

            return musicPlayer;
        }])
        .controller('MusicCtrl', ['$scope', function ($scope) {
            $scope.paused = true;
            $scope.title = '一番の宝物';
        }])
        .directive('blogKMusic', ['musicPlayer', function (musicPlayer) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, controller) {
                    musicPlayer.loadList();
                }
            };
        }]);
})(angular);