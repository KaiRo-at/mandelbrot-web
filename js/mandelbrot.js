/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is KaiRo.at Mandelbrot, XULRunner version.
 *
 * The Initial Developer of the Original Code is
 * Robert Kaiser <kairo@kairo.at>.
 * Portions created by the Initial Developer are Copyright (C) 2008-210
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Robert Kaiser <kairo@kairo.at>
 *   Boris Zbarsky <bzbarsky@mit.edu>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var gColorPalette = [];
var gStartTime = 0;

function drawImage() {
  var canvas = document.getElementById("mbrotImage");
  var context = canvas.getContext("2d");

  document.getElementById("calcTime").textContent = "--";

  gColorPalette = getColorPalette(document.getElementById("palette").value);

  var Cr_min = -2.0;
  var Cr_max = 1.0;
  try {
    Cr_min = parseFloat(document.getElementById("Cr_min").value);
    Cr_max = parseFloat(document.getElementById("Cr_max").value);
  }
  catch (e) { }
  if ((Cr_min < -2) || (Cr_min > 2) ||
      (Cr_max < -2) || (Cr_max > 2) || (Cr_min >= Cr_max)) {
    Cr_min = -2.0; Cr_max = 1.0;
  }
  document.getElementById("Cr_min").value = Cr_min;
  document.getElementById("Cr_max").value = Cr_max;

  var Ci_min = -1.5;
  var Ci_max = 1.5;
  try {
    Ci_min = parseFloat(document.getElementById("Ci_min").value);
    Ci_max = parseFloat(document.getElementById("Ci_max").value);
  }
  catch (e) { }
  if ((Ci_min < -2) || (Ci_min > 2) ||
      (Ci_max < -2) || (Ci_max > 2) || (Ci_min >= Ci_max)) {
    Ci_min = -1.5; Ci_max = 1.5;
  }
  document.getElementById("Ci_min").value = Ci_min;
  document.getElementById("Ci_max").value = Ci_max;

  //var algorithm = gPref.getCharPref("mandelbrot.use_algorithm");
  var iterMax = parseInt(document.getElementById("iterMax").value);
  var algorithm = "numeric"; //"oo"

  var iWidth = canvas.width;
  if ((iWidth < 10) || (iWidth > 5000)) {
    iWidth = 300;
    canvas.width = iWidth;
  }
  var iHeight = canvas.height;
  if ((iHeight < 10) || (iHeight > 5000)) {
    iHeight = 300;
    canvas.height = iHeight;
  }

  context.fillStyle = "rgba(255, 255, 255, 127)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  gStartTime = new Date();

  drawLine(0, [Cr_min, Cr_max, Ci_min, Ci_max],
              canvas, context, iterMax, algorithm);
}

function drawLine(line, dimensions, canvas, context, iterMax, algorithm) {
    var Cr_min = dimensions[0];
    var Cr_max = dimensions[1];
    var Cr_scale = Cr_max - Cr_min;

    var Ci_min = dimensions[2];
    var Ci_max = dimensions[3];
    var Ci_scale = Ci_max - Ci_min;

    var lines = Math.min(canvas.height - line, 8);
    var imageData = context.createImageData(canvas.width, lines);
    var pixels = imageData.data;
    var idx = 0;
    for (var img_y = line; img_y < canvas.height && img_y < line+8; img_y++)
      for (var img_x = 0; img_x < canvas.width; img_x++) {
        var C = new complex(Cr_min + (img_x / canvas.width) * Cr_scale,
                            Ci_min + (img_y / canvas.height) * Ci_scale);
        var colors = drawPoint(context, img_x, img_y, C, iterMax, algorithm);
        pixels[idx++] = colors[0];
        pixels[idx++] = colors[1];
        pixels[idx++] = colors[2];
        pixels[idx++] = colors[3];
      }
    context.putImageData(imageData, 0, line);

    if (img_y < canvas.height)
      setTimeout(drawLine, 0, img_y, dimensions, canvas, context, iterMax, algorithm);
    else if (gStartTime)
      EndCalc();
}

function EndCalc() {
  var endTime = new Date();
  var timeUsed = (endTime.getTime() - gStartTime.getTime()) / 1000;
  document.getElementById("calcTime").textContent = timeUsed.toFixed(3) + " seconds";
}

function complex(aReal, aImag) {
  this.r = aReal;
  this.i = aImag;
}
complex.prototype = {
  square: function() {
    return new complex(this.r * this.r - this.i * this.i,
                       2 * this.r * this.i);
  },
  dist: function() {
    return Math.sqrt(this.r * this.r + this.i * this.i);
  },
  add: function(aComplex) {
    return new complex(this.r + aComplex.r, this.i + aComplex.i);
  }
}

function mandelbrotValueOO (aC, aIterMax) {
  // this would be nice code in general but it looks like JS objects are too heavy for normal use.
  var Z = new complex(0.0, 0.0);
  for (var iter = 0; iter < aIterMax; iter++) {
    Z = Z.square().add(aC);
    if (Z.r * Z.r + Z.i * Z.i > 256) { break; }
  }
  return iter;
}

function mandelbrotValueNumeric (aC, aIterMax) {
  // optimized numeric code for fast calculation
  var Cr = aC.r, Ci = aC.i;
  var Zr = 0.0, Zi = 0.0;
  var Zr2 = Zr * Zr, Zi2 = Zi * Zi;
  for (var iter = 0; iter < aIterMax; iter++) {
    Zi = 2 * Zr * Zi + Ci;
    Zr = Zr2 - Zi2 + Cr;

    Zr2 = Zr * Zr; Zi2 = Zi * Zi;
    if (Zr2 + Zi2 > 256) { break; }
  }
  return iter;
}

function getColor(aIterValue, aIterMax) {
  var standardizedValue = Math.round(aIterValue * 1024 / aIterMax);
  if (gColorPalette && gColorPalette.length)
    return gColorPalette[standardizedValue];

  // fallback to simple b/w if for some reason we don't have a palette
  if (aIterValue == aIterMax)
    return [0, 0, 0, 255];
  else
    return [255, 255, 255, 255];
}

function getColorPalette(palName) {
  var palette = [];
  switch (palName) {
    case 'bw':
      for (var i = 0; i < 1024; i++) {
        palette[i] = [255, 255, 255, 255];
      }
      palette[1024] = [0, 0, 0, 255];
      break;
    case 'kairo':
      // outer areas
      for (var i = 0; i < 32; i++) {
        var cc1 = Math.floor(i * 127 / 31);
        var cc2 = 170 - Math.floor(i * 43 / 31);
        palette[i] = [cc1, cc2, cc1, 255];
      }
      // inner areas
      for (var i = 0; i < 51; i++) {
        var cc = Math.floor(i * 170 / 50);
        palette[32 + i] = [cc, 0, (170-cc), 255];
      }
      // corona
      for (var i = 0; i < 101; i++) {
        var cc = Math.floor(i * 200 / 100);
        palette[83 + i] = [255, cc, 0, 255];
      }
      // inner corona
      for (var i = 0; i < 201; i++) {
        var cc1 = 255 - Math.floor(i * 85 / 200);
        var cc2 = 200 - Math.floor(i * 30 / 200);
        var cc3 = Math.floor(i * 170 / 200);
        palette[184 + i] = [cc1, cc2, cc3, 255];
      }
      for (var i = 0; i < 301; i++) {
        var cc1 = 170 - Math.floor(i * 43 / 300);
        var cc2 = 170 + Math.floor(i * 85 / 300);
        palette[385 + i] = [cc1, cc1, cc2, 255];
      }
      for (var i = 0; i < 338; i++) {
        var cc = 127 + Math.floor(i * 128 / 337);
        palette[686 + i] = [cc, cc, 255, 255];
      }
      palette[1024] = [0, 0, 0, 255];
      break;
    case 'rainbow-linear1':
      for (var i = 0; i < 256; i++) {
        palette[i] = [i, 0, 0, 255];
        palette[256 + i] = [255, i, 0, 255];
        palette[512 + i] = [255 - i, 255, i, 255];
        palette[768 + i] = [i, 255-i, 255, 255];
      }
      palette[1024] = [0, 0, 0, 255];
      break;
  }
  return palette;
}

function drawPoint(context, img_x, img_y, C, iterMax, algorithm) {
  var itVal;
  switch (algorithm) {
    case 'oo':
      itVal = mandelbrotValueOO(C, iterMax);
      break;
    case 'numeric':
    default:
      itVal = mandelbrotValueNumeric(C, iterMax);
      break;
  }
  return getColor(itVal, iterMax);
}

// ########## UI functions ##########

function toggleSettings() {
  var fs = document.getElementById("settings");
  if (fs.style.display != "block") {
    fs.style.display = "block";
  }
  else {
    fs.style.display = "none";
  }
}