angular.module('blog_k.services.member', [])
    .factory('member', ['$http', function ($http) {
        var member = {
            checkOnline: function (callback) {
                $http.post('/checkOnline')
                    .success(function (data, status, headers, config) {
                        if (typeof callback === 'function') {
                            callback.call(member, null, data.user);
                        }
                    })
                    .error(function (data, status, headers, config) {
                        if (typeof callback === 'function') {
                            callback.call(member, data.error, null);
                        }
                    });
            },
            login: function (username, password, callback) {
                $http.post('/login', {
                    username: username,
                    password: password
                })
                    .success(function (data, status, headers, config) {
                        if (typeof callback === 'function') {
                            callback.call(member, null, data);    
                        }
                    })
                    .error(function (data, status, headers, config) {
                        if (typeof callback === 'function') {
                            callback.call(member, data.error, null);
                        }
                    });
            }
        };

        return member;
    }]);