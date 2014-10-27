window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

Blob.prototype.slice = Blob.prototype.slice || Blob.prototype.webkitSlice;