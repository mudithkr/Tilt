/*
 * TiltChromeControllers.js - Controller implementations handling events
 * version 0.1
 *
 * Copyright (c) 2011 Victor Porof
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */
"use strict";

var TiltChrome = TiltChrome || {};
var EXPORTED_SYMBOLS = ["TiltChrome.Controller.MouseAndKeyboard"];

/**
 * A mouse and keyboard implementation.
 */
TiltChrome.Controller = {};
TiltChrome.Controller.MouseAndKeyboard = function() {

  var self = this,

  /**
   * Arcball used to control the visualization using the mouse.
   */
  arcball = null,

  /**
   * Visualization translation and rotation on the X and Y axis.
   */
  translationX = 0,
  translationY = 0,
  dragX = 0,
  dragY = 0,
  rotationX = 0,
  rotationY = 0,
  euler = quat4.create(),

  /**
   * Retain the mouse drag state and position, to manipulate the arcball.
   */
  mouseDragged = false,
  mouseStartX = 0,
  mouseStartY = 0,
  mouseX = 0,
  mouseY = 0,

  /**
   * Retain the keyboard state.
   */
  keyCode = [];

  /**
   * Function called automatically by the visualization at the setup().
   * @param {HTMLCanvasElement} canvas: the canvas element
   */
  self.init = function(canvas) {
    arcball = new Tilt.Arcball(canvas.width, canvas.height);

    // bind commonly used mouse and keyboard events with the controller
    canvas.addEventListener("mousedown", mousePressed, false);
    canvas.addEventListener("mouseup", mouseReleased, false);
    canvas.addEventListener("mousemove", mouseMoved, false);
    canvas.addEventListener("mouseout", mouseOut, false);
    canvas.addEventListener("DOMMouseScroll", mouseScroll, false);
    window.content.document.addEventListener("keydown", keyPressed, false);
    window.content.document.addEventListener("keyup", keyReleased, false);
  };

  /**
   * Function called automatically by the visualization each frame in draw().
   * @param {Number} frameDelta: the delta time elapsed between frames
   */
  self.loop = function(frameDelta) {
    // handle mouse dragged events
    if (mouseDragged) {
      if (keyCoded()) {
        translationX = dragX + mouseX - mouseStartX;
        translationY = dragY + mouseY - mouseStartY;

        self.setTranslation(translationX, translationY, 0);
        return;
      }
      else {
        arcball.mouseDragged(mouseX, mouseY);
      }
    }

    // handle key pressed events
    if (!keyCoded()) {
      if (keyCode[37]) { // left
        translationX += frameDelta / 3;
      }
      if (keyCode[39]) { // right
        translationX -= frameDelta / 3;
      }
      if (keyCode[38]) { // up
        translationY += frameDelta / 3;
      }
      if (keyCode[40]) { // down
        translationY -= frameDelta / 3;
      }
      if (keyCode[65]) { // w
        rotationY -= Tilt.Math.radians(frameDelta) / 10;
      }
      if (keyCode[68]) { // s
        rotationY += Tilt.Math.radians(frameDelta) / 10;
      }
      if (keyCode[87]) { // a
        rotationX += Tilt.Math.radians(frameDelta) / 10;
      }
      if (keyCode[83]) { // d
        rotationX -= Tilt.Math.radians(frameDelta) / 10;
      }
    }

    // get the arcball rotation and zoom coordinates
    var coord = arcball.loop(frameDelta);

    // create another custom rotation
    Tilt.Math.quat4fromEuler(rotationY, rotationX, 0, euler);

    // update the visualization
    self.setRotation(quat4.multiply(euler, coord.rotation));
    self.setTranslation(translationX, translationY, coord.zoom);
  };

  /**
   * Called once after every time a mouse button is pressed.
   */
  function mousePressed(e) {
    e.preventDefault();
    e.stopPropagation();

    mouseX = e.clientX - e.target.offsetLeft;
    mouseY = e.clientY - e.target.offsetTop;
    mouseStartX = mouseX;
    mouseStartY = mouseY;
    dragX = translationX;
    dragY = translationY;

    if (!keyCoded()) {
      arcball.mousePressed(mouseX, mouseY);
    }
    mouseDragged = true;
  };

  /**
   * Called every time a mouse button is released.
   */
  function mouseReleased(e) {
    e.preventDefault();
    e.stopPropagation();

    mouseDragged = false;

    if (mouseStartX === mouseX && mouseStartY === mouseY) {
      self.performClick(mouseX, mouseY);
    }
  };

  /**
   * Called every time the mouse moves.
   */
  function mouseMoved(e) {
    e.preventDefault();
    e.stopPropagation();

    mouseX = e.clientX - e.target.offsetLeft;
    mouseY = e.clientY - e.target.offsetTop;
  };

  /**
   * Called when the the mouse leaves the visualization bounds.
   */
  function mouseOut(e) {
    e.preventDefault();
    e.stopPropagation();

    mouseDragged = false;
  };

  /**
   * Called when the the mouse wheel is used.
   */
  function mouseScroll(e) {
    e.preventDefault();
    e.stopPropagation();

    arcball.mouseScroll(e.detail);
  };

  /**
   * Called when a key is pressed.
   */
  function keyPressed(e) {
    var code = e.keyCode || e.which;
    keyCode[code] = true;

    if (keyCoded()) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
   * Called when a key is released.
   */
  function keyReleased(e) {
    var code = e.keyCode || e.which;
    keyCode[code] = false;

    if (code === 27) { // escape
      TiltChrome.BrowserOverlay.href = null;
      TiltChrome.BrowserOverlay.destroy();
    }

    if (keyCoded()) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
   * Returns if the key is coded (control or command).
   * @return {Boolean} true if the key is coded
   */
  function keyCoded() {
    if (keyCode !== null) {
      return keyCode[17] || keyCode[224];
    }
    else {
      return false;
    }
  };

  /**
   * Destroys this object and sets all members to null.
   * @param {HTMLCanvasElement} canvas: the canvas dom element
   */
  this.destroy = function(canvas) {
    canvas.removeEventListener("mousedown", mousePressed, false);
    canvas.removeEventListener("mouseup", mouseReleased, false);
    canvas.removeEventListener("mousemove", mouseMoved, false);
    canvas.removeEventListener("mouseout", mouseOut, false);
    canvas.removeEventListener("DOMMouseScroll", mouseScroll, false);
    window.content.document.removeEventListener("keydown", keyPressed, false);
    window.content.document.removeEventListener("keyup", keyReleased, false);

    arcball.destroy();
    arcball = null;
    euler = null;
    keyCode = null;

    for (var i in this) {
      delete this[i];
    }

    self = null;
  };
};
