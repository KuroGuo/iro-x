;(function (angular) { 'use strict';
    angular.module('iro.video', ['iro.services.memory', 'k-player'])
        .controller('VideoCtrl', [function () {
        }])
        .directive('iroVideo', ['$window', 'memory', function ($window, memory) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, controller) {
                    memory.get('videoModel') && (scope.player = memory.get('videoModel'));

                    element.on('$destroy', function () {
                        memory.set('videoModel', scope.player);
                    });
                }
            };
        }]);
})(angular);