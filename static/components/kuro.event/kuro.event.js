'use strict';

angular.module('kuro.event', []).
    factory('KuroEvent', function () {
        function Event() {
            this.funcList = [];
        }

        Event.prototype.trigger = function (sender, e) {
            for (var i = 0; i < this.funcList.length; i++) {
                this.funcList[i].call(sender, e);
            }
            return this;
        };

        Event.prototype.addListener = function (func) {
            this.funcList.push(func);
            return this;
        };

        Event.prototype.removeListener = function (func) {
            for (var i = 0; i < this.funcList.length; i++) {
                if (this.funcList[i] === func) {
                    this.funcList.splice(i, 1);
                    i--;
                }
            }
            return this;
        };

        return Event;
    });