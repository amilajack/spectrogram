/**
 * @fileoverview This file contains a class which assists with the
 * loading of GLSL shaders.
 */

o3djs.provide('o3djs.shader');

/**
 * A module for shaders.
 * @namespace
 */
o3djs.shader = o3djs.shader || {};

/**

 * Loads a shader from vertex and fragment programs specified in
 * "script" nodes in the HTML page. This provides a convenient
 * mechanism for writing GLSL snippets without the burden of
 * additional syntax like per-line quotation marks.
 * @param {!WebGLRenderingContext} gl The WebGLRenderingContext
 *     into which the shader will be loaded.
 * @param {!string} vertexScriptName The name of the HTML Script node
 *     containing the vertex program.
 * @param {!string} fragmentScriptName The name of the HTML Script node
 *     containing the fragment program.
 */
o3djs.shader.loadFromScriptNodes = function(
  gl,
  vertexScriptName,
  fragmentScriptName
) {
  const vertexScript = document.getElementById(vertexScriptName);
  const fragmentScript = document.getElementById(fragmentScriptName);
  if (!vertexScript || !fragmentScript) {
    return null;
  }
  return new o3djs.shader.Shader(gl, vertexScript.text, fragmentScript.text);
};

/**
 * Loads text from an external file. This function is synchronous.
 * @param {string} url The url of the external file.
 * @return {string} the loaded text if the request is synchronous.
 */
o3djs.shader.loadTextFileSynchronous = function(url) {
  const error = `loadTextFileSynchronous failed to load url "${url}"`;
  let request;

  request = new XMLHttpRequest();
  if (request.overrideMimeType) {
    request.overrideMimeType('text/plain');
  }

  request.open('GET', url, false);
  request.send(null);
  if (request.readyState != 4) {
    throw error;
  }
  return request.responseText;
};

o3djs.shader.loadFromURL = function(gl, vertexURL, fragmentURL) {
  const vertexText = o3djs.shader.loadTextFileSynchronous(vertexURL);
  const fragmentText = o3djs.shader.loadTextFileSynchronous(fragmentURL);

  if (!vertexText || !fragmentText) {
    return null;
  }
  return new o3djs.shader.Shader(gl, vertexText, fragmentText);
};

/**
 * Helper which convers GLSL names to JavaScript names.
 * @private
 */
o3djs.shader.glslNameToJs_ = function(name) {
  return name.replace(/_(.)/g, (_, p1) => p1.toUpperCase());
};

/**
 * Creates a new Shader object, loading and linking the given vertex
 * and fragment shaders into a program.
 * @param {!WebGLRenderingContext} gl The WebGLRenderingContext
 *     into which the shader will be loaded.
 * @param {!string} vertex The vertex shader.
 * @param {!string} fragment The fragment shader.
 */
o3djs.shader.Shader = function(gl, vertex, fragment) {
  this.program = gl.createProgram();
  this.gl = gl;

  const vs = this.loadShader(this.gl.VERTEX_SHADER, vertex);
  if (vs == null) {
    return;
  }
  this.gl.attachShader(this.program, vs);
  this.gl.deleteShader(vs);

  const fs = this.loadShader(this.gl.FRAGMENT_SHADER, fragment);
  if (fs == null) {
    return;
  }
  this.gl.attachShader(this.program, fs);
  this.gl.deleteShader(fs);

  this.gl.linkProgram(this.program);
  this.gl.useProgram(this.program);

  // Check the link status
  const linked = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
  if (!linked) {
    const infoLog = this.gl.getProgramInfoLog(this.program);
    output(`Error linking program:\n${infoLog}`);
    this.gl.deleteProgram(this.program);
    this.program = null;
    return;
  }

  // find uniforms and attributes
  const re = /(uniform|attribute)\s+\S+\s+(\S+)\s*;/g;
  let match = null;
  while ((match = re.exec(`${vertex}\n${fragment}`)) != null) {
    const glslName = match[2];
    const jsName = o3djs.shader.glslNameToJs_(glslName);
    const loc = -1;
    if (match[1] == 'uniform') {
      this[`${jsName}Loc`] = this.getUniform(glslName);
    } else if (match[1] == 'attribute') {
      this[`${jsName}Loc`] = this.getAttribute(glslName);
    }
    if (loc >= 0) {
      this[`${jsName}Loc`] = loc;
    }
  }
};

/**
 * Binds the shader's program.
 */
o3djs.shader.Shader.prototype.bind = function() {
  this.gl.useProgram(this.program);
};

/**
 * Helper for loading a shader.
 * @private
 */
o3djs.shader.Shader.prototype.loadShader = function(type, shaderSrc) {
  const shader = this.gl.createShader(type);
  if (shader == null) {
    return null;
  }

  // Load the shader source
  this.gl.shaderSource(shader, shaderSrc);
  // Compile the shader
  this.gl.compileShader(shader);
  // Check the compile status
  if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    const infoLog = this.gl.getShaderInfoLog(shader);
    output(`Error compiling shader:\n${infoLog}`);
    this.gl.deleteShader(shader);
    return null;
  }
  return shader;
};

/**
 * Helper for looking up an attribute's location.
 * @private
 */
o3djs.shader.Shader.prototype.getAttribute = function(name) {
  return this.gl.getAttribLocation(this.program, name);
};

/**
 * Helper for looking up an attribute's location.
 * @private
 */
o3djs.shader.Shader.prototype.getUniform = function(name) {
  return this.gl.getUniformLocation(this.program, name);
};
