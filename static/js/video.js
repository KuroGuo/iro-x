;(function (angular) { 'use strict';
    angular.module('blog_k.video', ['blog_k.services.memory', 'k-player'])
        .controller('VideoCtrl', [function () {
        }])
        .directive('blogKVideo', ['$window', 'memory', function ($window, memory) {
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