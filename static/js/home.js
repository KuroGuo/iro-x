angular.module('blog_k.home', ['kplayer'])
    .controller('HomeCtrl', ['$scope', '$state', '$timeout', function ($scope, $state, $timeout) {
        $timeout(function () {
            $scope.$apply(setDateTime);
        }, 1000);

        setDateTime();

        function setDateTime() {
            var now = new Date();

            setTime(now);
            setDate(now);
            setDay(now);
        }

        function setDate(now) {
            var month = now.getMonth() + 1;
            var date = now.getDate();
            var day = now.getDay();

            $scope.date = numToHanzi(month) + '月' + numToHanzi(date) + '日';
        }

        function setTime(now) {
            var hours = now.getHours();
            var minutes = now.getMinutes();

            $scope.time = hours + ':' + minutes;
        }

        function setDay(now) {
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

            $scope.day = dayHanzi[day];
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
    }]);