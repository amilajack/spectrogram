// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
//
// opt_canvas (an HTMLCanvasElement) and opt_context (a
// WebGLRenderingContext) can be passed in to make the hit detection
// more precise -- only opaque pixels will be considered as the start
// of a drag action.
function CameraController(element, opt_canvas, opt_context) {
  const controller = this;
  this.onchange = null;
  this.xRot = 0;
  this.yRot = 0;
  this.zRot = 0;
  this.scaleFactor = 3.0;
  this.dragging = false;
  this.curX = 0;
  this.curY = 0;

  if (opt_canvas) {
    this.canvas_ = opt_canvas;
  }

  if (opt_context) {
    this.context_ = opt_context;
  }

  // TODO(smus): Remove this to re-introduce mouse panning.
  return;

  // Assign a mouse down handler to the HTML element.
  element.onmousedown = function (ev) {
    controller.curX = ev.clientX;
    controller.curY = ev.clientY;
    let dragging = false;
    if (controller.canvas_ && controller.context_) {
      const rect = controller.canvas_.getBoundingClientRect();
      // Transform the event's x and y coordinates into the coordinate
      // space of the canvas
      const canvasRelativeX = ev.pageX - rect.left;
      const canvasRelativeY = ev.pageY - rect.top;
      const canvasWidth = controller.canvas_.width;
      const canvasHeight = controller.canvas_.height;

      // Read back a small portion of the frame buffer around this point
      if (
        canvasRelativeX > 0 &&
        canvasRelativeX < canvasWidth &&
        canvasRelativeY > 0 &&
        canvasRelativeY < canvasHeight
      ) {
        const pixels = controller.context_.readPixels(
          canvasRelativeX,
          canvasHeight - canvasRelativeY,
          1,
          1,
          controller.context_.RGBA,
          controller.context_.UNSIGNED_BYTE,
        );
        if (pixels) {
          // See whether this pixel has an alpha value of >= about 10%
          if (pixels[3] > 255.0 / 10.0) {
            dragging = true;
          }
        }
      }
    } else {
      dragging = true;
    }

    controller.dragging = dragging;
  };

  // Assign a mouse up handler to the HTML element.
  element.onmouseup = function (ev) {
    controller.dragging = false;
  };

  // Assign a mouse move handler to the HTML element.
  element.onmousemove = function (ev) {
    if (controller.dragging) {
      // Determine how far we have moved since the last mouse move
      // event.
      const curX = ev.clientX;
      const curY = ev.clientY;
      const deltaX = (controller.curX - curX) / controller.scaleFactor;
      const deltaY = (controller.curY - curY) / controller.scaleFactor;
      controller.curX = curX;
      controller.curY = curY;
      // Update the X and Y rotation angles based on the mouse motion.
      controller.yRot = (controller.yRot + deltaX) % 360;
      controller.xRot += deltaY;
      // Clamp the X rotation to prevent the camera from going upside
      // down.
      if (controller.xRot < -90) {
        controller.xRot = -90;
      } else if (controller.xRot > 90) {
        controller.xRot = 90;
      }
      // Send the onchange event to any listener.
      if (controller.onchange != null) {
        controller.onchange(controller.xRot, controller.yRot);
      }
    }
  };
}

module.exports = CameraController;
