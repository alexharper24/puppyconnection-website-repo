/* The browser's photo screen (workplan A9), shared by the portal and the admin. app/dev/setup.mjs copies
   it to the admin the same way as dialog.js. Edit the portal's copy only.

   A photo under MIN_EDGE on its longest side is refused, and a dark one asks first. The 100-photo
   sample's passing photos were all at least 1,080 px and none had a mean brightness under 76, while
   the two dark ones it sent back measured 62 and 64. The server runs the same floor and the Workers AI
   check after this (lib/photocheck.js), so this only saves the breeder an upload.

   pcScreenPhoto(file, what) resolves when the photo may go up. It rejects with the reason to show,
   or with Error('skip') when the person chose not to upload a dark photo. what names the animal in
   the question ('puppy' unless given). Needs dialog.js for pcAsk. */
(function () {
  'use strict';
  function decode(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' });
    return new Promise(function (ok, fail) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); fail(new Error('decode')); };
      im.src = u;
    });
  }
  var MIN_EDGE = 1000, DARK = 70;
  function brightness(src) {
    try {
      var c = document.createElement('canvas'); c.width = 48; c.height = 48;
      var g = c.getContext('2d'); g.drawImage(src, 0, 0, 48, 48);
      var d = g.getImageData(0, 0, 48, 48).data, sum = 0;
      for (var i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      return sum / (d.length / 4);
    } catch (e) { return 255; }
  }
  function pcScreenPhoto(file, what) {
    return decode(file).then(function (src) {
      var edge = Math.max(src.width, src.height);
      var light = brightness(src);
      if (src.close) src.close();
      if (edge < MIN_EDGE) throw new Error(file.name + ' is ' + edge + ' pixels across. Photos need to be at least ' + MIN_EDGE + ' pixels, so use the original from your phone or camera rather than a screenshot or a saved copy.');
      if (light < DARK) return pcAsk(file.name + ' looks dark, so families may not see the ' + (what || 'puppy') + ' well. Upload it anyway?', { yes: 'Upload anyway' })
        .then(function (ok) { if (!ok) throw new Error('skip'); });
    }, function () { /* a file the browser cannot decode goes up as it is, and the server checks it */ });
  }
  window.pcScreenPhoto = pcScreenPhoto;
})();
