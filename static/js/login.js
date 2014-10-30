;(function (angular) { 'use strict';
    angular.module('blog_k.login', ['ui.router'])
        .controller('LoginCtrl', ['$scope', '$state', 'member', function ($scope, $state, member) {
            $scope.submit = function () {
                var splited = $scope.nameandpassword.split('|'),
                    username = splited[0],
                    password = splited[1];

                member.login(username, password, function (err, result) {
                    if (err) {
                        $scope.loginInfo.state = 'error';
                        $scope.loginInfo.message = err;
                        return;
                    }
                    if (!result.isok) {
                        $scope.loginInfo.state = 'fail';
                        $scope.loginInfo.message = result.message;
                        return;
                    }
                    if (!result.user) {
                        throw new Error('我都登录成功了为啥子不给我个user对象？？？');
                    }
                    $scope.setUser(result.user);
                    $state.go('home');
                });

                $scope.loginInfo = {
                    state: 'wait',
                    message: ''
                };
            };
        }])
        .directive('kLogin', ['$window', '$document', function ($window, $document) {
            return {
                link: function (scope, element, attrs, controller) {
                    var loginBox = element.children('.login-box'),
                        bigLogo = loginBox.children('.big-logo'),
                        formLogin = loginBox.children('.form-login');

                    formLogin.css({
                        opacity: 0
                    });

                    bigLogo.velocity({
                        scale: 0.88
                    }, {
                        delay: 500,
                        duration: 600,
                        complete: function () {
                            formLogin.velocity({
                                opacity: 1
                            }, {
                                complete: function () {
                                    formLogin.find('[name="nameandpassword"]').trigger('focus');
                                }
                            });
                        }
                    });
                },
                templateUrl: '/partials/login.html',
                restrict: 'E'
            };
        }]);
})(angular);