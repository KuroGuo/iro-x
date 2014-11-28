;(function (angular) { 'use strict';
  angular.module('iro.services.navbar', [])
    .factory('navbar', [function () {
      var navbar = {};

      navbar.customBackgroundColor = null;

      return navbar;
    }]);
})(angular);