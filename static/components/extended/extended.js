window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame 
                            || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame
                            || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;

Blob.prototype.slice = Blob.prototype.slice || Blob.prototype.webkitSlice;

window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL;