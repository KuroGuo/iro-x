'use strict';

angular.module('kDrag', ['kuro.event']).
    factory('KuroDraggable', ['KuroEvent', '$timeout', function (Event, $timeout) {
        var dragId = 0;

        function Draggable(htmlElement, selector, delta) {
            htmlElement = $(htmlElement);
            delta = delta || 1;

            var $this = this;

            $this.element = htmlElement;

            $this.dragStart = new Event();
            $this.drag = new Event();
            $this.dragEnd = new Event();

            $this.delta = delta;
            $this.isOn = false;
            $this.state = 0; //0为Normal状态，1为MouseDown，2为MouseMove

            $this.dragStartPoint = null;

            htmlElement.on('mousedown', selector, function (e) {
                if (!$this.isOn) {
                    return;
                }

                e.preventDefault();

                var currentTarget = e.currentTarget,
                    target = e.target;

                $this.state = 1;
                $this.dragStartPoint = { x: e.pageX, y: e.pageY };

                var eventId = dragId++;

                var offDrag = function (e) {
                    var _do = function () {
                        e.preventDefault();

                        if ($this.state === 2) {
                            $this.dragEnd.trigger($this, {
                                currentTarget: currentTarget,
                                target: target,
                                startPoint: $this.dragStartPoint,
                                pageX: e.pageX,
                                pageY: e.pageY,
                                deltaX: (e.pageX - $this.dragStartPoint.x),
                                deltaY: (e.pageY - $this.dragStartPoint.y),
                                event: e
                            });
                        }

                        $(document).off('.drag' + eventId);
                        $(window).off('.drag' + eventId);

                        $this.state = 0;
                    };
                    if ('onmspointerdown' in window) {
                        //是IE
                        $timeout(_do);
                    } else {
                        _do();
                    }
                };

                $(document).on('mousemove.drag' + eventId, function (e) {
                    var _do = function () {
                        e.preventDefault();

                        if ($this.dragStartPoint.x === e.pageX && $this.dragStartPoint.y === e.pageY) {
                            return;
                        }

                        switch ($this.state) {
                            case 1:
                            case 2:
                                if ($this.state === 1) {
                                    if (Math.abs(e.pageX - $this.dragStartPoint.x) >= $this.delta || Math.abs(e.pageY - $this.dragStartPoint.y) >= $this.delta) {
                                        $this.state = 2;
                                        $this.dragStart.trigger($this, {
                                            currentTarget: currentTarget,
                                            target: target,
                                            startPoint: $this.dragStartPoint,
                                            pageX: e.pageX,
                                            pageY: e.pageY,
                                            deltaX: (e.pageX - $this.dragStartPoint.x),
                                            deltaY: (e.pageY - $this.dragStartPoint.y),
                                            event: e,
                                            prevent: function () {
                                                $(document).off('.drag' + eventId);
                                                $this.state = 0;
                                            }
                                        });
                                    }
                                }
                                if ($this.state === 2) {
                                    $this.drag.trigger($this, {
                                        currentTarget: currentTarget,
                                        target: target,
                                        startPoint: $this.dragStartPoint,
                                        pageX: e.pageX,
                                        pageY: e.pageY,
                                        deltaX: (e.pageX - $this.dragStartPoint.x),
                                        deltaY: (e.pageY - $this.dragStartPoint.y),
                                        event: e,
                                        prevent: function () {
                                            $(document).off('.drag' + eventId);
                                            $this.state = 0;
                                        }
                                    });
                                }
                                break;
                        }
                    };
                    if ('onmspointerdown' in window) {
                        //是IE
                        setTimeout(_do);
                    } else {
                        _do();
                    }
                }).on('mouseup.drag' + eventId, offDrag);
                $(window).on('blur.drag' + eventId, offDrag);
            });

            $this.on();
        }

        Draggable.prototype.on = function () {
            this.isOn = true;
        };

        Draggable.prototype.off = function () {
            this.isOn = false;
        };

        return Draggable;
    }]);