;(function (angular) { 'use strict';
    angular.module('iro.home', [])
        .controller('HomeCtrl', ['$scope', function ($scope) {
        }])
        .directive('datetimeBox', ['$interval', function ($interval) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, controller) {
                    $interval(setDateTime, 1000);

                    setDateTime();

                    function setDateTime() {
                        var now = new Date();

                        scope.time = getTime(now);
                        scope.date = getDate(now);
                        scope.day = getDay(now);
                    }

                    function getDate(now) {
                        var month = now.getMonth() + 1;
                        var date = now.getDate();
                        var day = now.getDay();

                        return numToHanzi(month) + '月' + numToHanzi(date) + '日';
                    }

                    function getTime(now) {
                        var hours = now.getHours();
                        var minutes = now.getMinutes();

                        if (hours < 10) {
                            hours = '0' + hours;
                        }
                        if (minutes < 10) {
                            minutes + '0' + minutes;
                        }

                        return hours + ':' + minutes;
                    }

                    function getDay(now) {
                        var day = now.getDay();

                        var dayHanzi = {
                            '0': '星期日',
                            '1': '星期一',
                            '2': '星期二',
                            '3': '星期三',
                            '4': '星期四',
                            '5': '星期五',
                            '6': '星期六'
                        };

                        return dayHanzi[day];
                    }

                    function numToHanzi(num) {
                        var tens = Math.floor(num / 10);
                        var units = Math.floor(num % 10);

                        var numHanzi = {
                            '0': '',
                            '1': '一',
                            '2': '二',
                            '3': '三',
                            '4': '四',
                            '5': '五',
                            '6': '六',
                            '7': '七',
                            '8': '八',
                            '9': '九'
                        };

                        var result = '';

                        if (tens > 0) {
                            if (tens > 1) {
                                result += numHanzi[tens];
                            }
                            result += '十';
                        }
                        result += numHanzi[units];

                        return result;
                    }
                }
            };

            $interval(function () {
                $scope.$apply(setDateTime);
            }, 1000);
        }]);
})(angular);