;(function (angular) { 'use strict';
    angular.module('blog_k.services.memory', [])
        .factory('memory', [function () {
            var memory = {};

            return {
                get: function (key) {
                    return memory[key];
                },
                set: function (key, value) {
                    memory[key] = value;
                },
                remove: function (key) {
                    delete memory[key];
                }
            };
        }]);
})(angular);