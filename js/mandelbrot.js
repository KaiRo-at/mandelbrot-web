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
var gCurrentImageData;
var gLastImageData;

function Startup() {
  var img = document.getElementById("mbrotImage");
  img.addEventListener("mouseup", imgEvHandler, false);
  img.addEventListener("mousedown", imgEvHandler, false);
  img.addEventListener("mousemove", imgEvHandler, false);
  img.addEventListener("touchstart", imgEvHandler, false);
  img.addEventListener("touchend", imgEvHandler, false);
  img.addEventListener("touchcancel", imgEvHandler, false);
  img.addEventListener("touchleave", imgEvHandler, false);
  img.addEventListener("touchmove", imgEvHandler, false);
}

function getAdjustVal(aName) {
  var value;
  switch (aName) {
    case "image.width":
    case "image.height":
      value = 0;
      try {
        value = document.getElementById(aName.replace(".", "_")).value;
      }
      catch (e) { }
      if ((value < 10) || (value > 5000)) {
        value = 300;
        //document.getElementById(aName.replace(".", "_")).value = value;
      }
      return value;
    case "last_image.Cr_*":
      var Cr_min = -2.0;
      var Cr_max = 1.0;
      try {
        Cr_min = parseFloat(document.getElementById("Cr_min").value);
        Cr_max = parseFloat(document.getElementById("Cr_max").value);
      }
      catch (e) { }
      if ((Cr_min < -3) || (Cr_min > 2) ||
          (Cr_max < -3) || (Cr_max > 2) || (Cr_min >= Cr_max)) {
        Cr_min = -2.0; Cr_max = 1.0;
      }
      document.getElementById("Cr_min").value = Cr_min;
      document.getElementById("Cr_max").value = Cr_max;
      return {Cr_min: Cr_min, Cr_max: Cr_max};
    case "last_image.Ci_*":
      var Ci_min = -1.5;
      var Ci_max = 1.5;
      try {
        Ci_min = parseFloat(document.getElementById("Ci_min").value);
        Ci_max = parseFloat(document.getElementById("Ci_max").value);
      }
      catch (e) { }
      if ((Ci_min < -2.5) || (Ci_min > 2.5) ||
          (Ci_max < -2.5) || (Ci_max > 2.5) || (Ci_min >= Ci_max)) {
        Ci_min = -1.5; Ci_max = 1.5;
      }
      document.getElementById("Ci_min").value = Ci_min;
      document.getElementById("Ci_max").value = Ci_max;
      return {Ci_min: Ci_min, Ci_max: Ci_max};
    case "iteration_max":
      value = 500;
      try {
        value = document.getElementById("iterMax").value;
      }
      catch (e) {
        setIter(value);
      }
      if (value < 10 || value > 10000) {
        value = 500;
        setIter(value);
      }
      return value;
    case "use_algorithm":
      value = "numeric";
      try {
        value = document.getElementById("algorithm").value;
      }
      catch (e) {
        setAlgorithm(value);
      }
      return value;
   case "color_palette":
      value = "kairo";
      try {
        value = document.getElementById("palette").value;
      }
      catch(e) {
        setPalette(value);
      }
      return value;
   case "syncProportions":
      value = true;
      try {
        value = document.getElementById("proportional").value;
      }
      catch(e) {
        document.getElementById("proportional").value = value;
      }
      return value;
    default:
      return false;
  }
}

function setVal(aName, aValue) {
  switch (aName) {
    case "image.width":
    case "image.height":
      document.getElementById(aName.replace(".", "_")).value = value;
      break;
    case "last_image.Cr_*":
      document.getElementById("Cr_min").value = aValue.Cr_min;
      document.getElementById("Cr_max").value = aValue.Cr_max;
      break;
    case "last_image.Ci_*":
      document.getElementById("Ci_min").value = aValue.Ci_min;
      document.getElementById("Ci_max").value = aValue.Ci_max;
      break;
    case "iteration_max":
      setIter(aValue);
      break;
    case "use_algorithm":
      setAlgorithm(aValue);
      break;
   case "color_palette":
      setPalette(valueaValue);
      break;
   case "syncProportions":
      document.getElementById("proportional").value = aValue;
      break;
  }
}

function adjustCoordsAndDraw(aC_min, aC_max) {
  var iWidth = getAdjustVal("image.width");
  var iHeight = getAdjustVal("image.height");

  // correct coordinates
  if (aC_min.r < -2)
    aC_min.r = -2;
  if (aC_max.r > 2)
    aC_max.r = 2;
  if ((aC_min.r > 2) || (aC_max.r < -2) || (aC_min.r >= aC_max.r)) {
    aC_min.r = -2.0; aC_max.r = 1.0;
  }
  if (aC_min.i < -2)
    aC_min.i = -2;
  if (aC_max.i > 2)
    aC_max.i = 2;
  if ((aC_min.i > 2) || (aC_max.i < -2) || (aC_min.i >= aC_max.i)) {
    aC_min.i = -1.3; aC_max.i = 1.3;
  }

  var CWidth = aC_max.r - aC_min.r;
  var CHeight = aC_max.i - aC_min.i;
  var C_mid = new complex(aC_min.r + CWidth / 2, aC_min.i + CHeight / 2);

  var CRatio = Math.max(CWidth / iWidth, CHeight / iHeight);

  setVal("last_image.Cr_*", {Cr_min: C_mid.r - iWidth * CRatio / 2,
                             Cr_max: C_mid.r + iWidth * CRatio / 2});
  setVal("last_image.Ci_*", {Ci_min: C_mid.i - iHeight * CRatio / 2,
                             Ci_max: C_mid.i + iHeight * CRatio / 2});

  drawImage();
}

function drawImage() {
  var canvas = document.getElementById("mbrotImage");
  var context = canvas.getContext("2d");

  document.getElementById("calcTime").textContent = "--";

  if (gCurrentImageData) {
    gLastImageData = gCurrentImageData;
  }

  gColorPalette = getColorPalette(document.getElementById("palette").value);

  var Cr_vals = getAdjustVal("last_image.Cr_*");
  var Cr_min = Cr_vals.Cr_min;
  var Cr_max = Cr_vals.Cr_max;

  var Ci_vals = getAdjustVal("last_image.Ci_*");
  var Ci_min = Ci_vals.Ci_min;
  var Ci_max = Ci_vals.Ci_max;

  var iterMax = getAdjustVal("iteration_max");
  var algorithm = getAdjustVal("use_algorithm");

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

  gCurrentImageData = {
    C_min: new complex(Cr_min, Ci_min),
    C_max: new complex(Cr_max, Ci_max),
    iWidth: iWidth,
    iHeight: iHeight,
    iterMax: iterMax
  };

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
    case 'rainbow-squared1':
      for (var i = 0; i < 34; i++) {
        var cc = Math.floor(i * 255 / 33);
        palette[i] = [cc, 0, 0, 255];
      }
      for (var i = 0; i < 137; i++) {
        var cc = Math.floor(i * 255 / 136);
        palette[34 + i] = [255, cc, 0, 255];
      }
      for (var i = 0; i < 307; i++) {
        var cc = Math.floor(i * 255 / 306);
        palette[171 + i] = [255 - cc, 255, cc, 255];
      }
      for (var i = 0; i < 546; i++) {
        var cc = Math.floor(i * 255 / 545);
        palette[478 + i] = [cc, 255 - cc, 255, 255];
      }
      palette[1024] = [0, 0, 0, 255];
      break;
    case 'rainbow-linear2':
      for (var i = 0; i < 205; i++) {
        var cc = Math.floor(i * 255 / 204);
        palette[i] = [255, cc, 0, 255];
        palette[204 + i] = [255 - cc, 255, 0, 255];
        palette[409 + i] = [0, 255, cc, 255];
        palette[614 + i] = [0, 255 - cc, 255, 255];
        palette[819 + i] = [cc, 0, 255, 255];
      }
      palette[1024] = [0, 0, 0, 255];
      break;
    case 'rainbow-squared2':
      for (var i = 0; i < 19; i++) {
        var cc = Math.floor(i * 255 / 18);
        palette[i] = [255, cc, 0, 255];
      }
      for (var i = 0; i < 74; i++) {
        var cc = Math.floor(i * 255 / 73);
        palette[19 + i] = [255 - cc, 255, 0, 255];
      }
      for (var i = 0; i < 168; i++) {
        var cc = Math.floor(i * 255 / 167);
        palette[93 + i] = [0, 255, cc, 255];
      }
      for (var i = 0; i < 298; i++) {
        var cc = Math.floor(i * 255 / 297);
        palette[261 + i] = [0, 255 - cc, 255, 255];
      }
      for (var i = 0; i < 465; i++) {
        var cc = Math.floor(i * 255 / 464);
        palette[559 + i] = [cc, 0, 255, 255];
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

var zoomstart;
var imgBackup;
var zoomTouchID;

var imgEvHandler = {
  handleEvent: function(aEvent) {
    var canvas = document.getElementById("mbrotImage");
    var context = canvas.getContext("2d");
    var touchEvent = aEvent.type.indexOf('touch') != -1;

    // Bail out if this is neither a touch nor left-click.
    if (!touchEvent && aEvent.button != 0)
      return;

    // Bail out if the started touch can't be found.
    if (touchEvent && zoomstart &&
        !aEvent.changedTouches.identifiedTouch(zoomTouchID))
      return;

    var coordObj = touchEvent ?
                   aEvent.changedTouches.identifiedTouch(zoomTouchID) :
                   aEvent;

    switch (aEvent.type) {
      case 'mousedown':
      case 'touchstart':
        if (touchEvent) {
          zoomTouchID = aEvent.changedTouches.item(0).identifier;
          coordObj = aEvent.changedTouches.identifiedTouch(zoomTouchID);
        }
        // left button - start dragzoom
        zoomstart = {x: coordObj.clientX - canvas.offsetLeft,
                     y: coordObj.clientY - canvas.offsetTop};
        imgBackup = context.getImageData(0, 0, canvas.width, canvas.height);
        break;
      case 'mouseup':
      case 'touchend':
        if (zoomstart) {
          context.putImageData(imgBackup, 0, 0);
          var zoomend = {x: coordObj.clientX - canvas.offsetLeft,
                         y: coordObj.clientY - canvas.offsetTop};

          // make sure zoomend is bigger than zoomstart
          if ((zoomend.x == zoomstart.x) || (zoomend.y == zoomstart.y)) {
            // cannot zoom what has no area, discard it
            zoomstart = undefined;
            return;
          }
          if (zoomend.x < zoomstart.x)
            [zoomend.x, zoomstart.x] = [zoomstart.x, zoomend.x];
          if (zoomend.y < zoomstart.y)
            [zoomend.y, zoomstart.y] = [zoomstart.y, zoomend.y];

          // determine new "coordinates"
          var CWidth = gCurrentImageData.C_max.r - gCurrentImageData.C_min.r;
          var CHeight = gCurrentImageData.C_max.i - gCurrentImageData.C_min.i;
          var newC_min = new complex(
              gCurrentImageData.C_min.r + zoomstart.x / gCurrentImageData.iWidth * CWidth,
              gCurrentImageData.C_min.i + zoomstart.y / gCurrentImageData.iHeight * CHeight);
          var newC_max = new complex(
              gCurrentImageData.C_min.r + zoomend.x / gCurrentImageData.iWidth * CWidth,
              gCurrentImageData.C_min.i + zoomend.y / gCurrentImageData.iHeight * CHeight);

          adjustCoordsAndDraw(newC_min, newC_max);
        }
        zoomstart = undefined;
        break;
      case 'mousemove':
      case 'touchmove':
        if (zoomstart) {
          context.putImageData(imgBackup, 0, 0);
          context.strokeStyle = "rgb(255,255,31)";
          context.strokeRect(zoomstart.x, zoomstart.y,
                             coordObj.clientX - canvas.offsetLeft - zoomstart.x,
                             coordObj.clientY - canvas.offsetTop - zoomstart.y);
        }
      break;
    }
  }
};

function toggleSettings() {
  var fs = document.getElementById("settings");
  if (fs.style.display != "block") {
    fs.style.display = "block";
  }
  else {
    fs.style.display = "none";
  }
}

function goBack() {
  if (gLastImageData) {
    document.getElementById("iterMax").value = gLastImageData.iterMax;
    // use gLastImageData.iWidth, gLastImageData.iHeight ???
    adjustCoordsAndDraw(gLastImageData.C_min, gLastImageData.C_max);
    gLastImageData = undefined;
  }
}

function setIter(aIter) {
  document.getElementById("iterMax").value = aIter;
}

function setPalette(aPaletteID) {
  document.getElementById("palette").value = aPaletteID;
  gColorPalette = getColorPalette(aPaletteID);
}

function setAlgorithm(algoID) {
  //document.getElementById("algorithm").value = algoID;
}
