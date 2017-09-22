/**
 * @fileoverview This file contains matrix/vector math functions.
 * It adds them to the "math" module on the o3djs object.
 *
 * o3djs.math supports a row-major and a column-major mode.  In both
 * modes, vectors are stored as arrays of numbers, and matrices are stored as
 * arrays of arrays of numbers.
 *
 * In row-major mode:
 *
 * - Rows of a matrix are sub-arrays.
 * - Individual entries of a matrix M get accessed in M[row][column] fashion.
 * - Tuples of coordinates are interpreted as row-vectors.
 * - A vector v gets transformed by a matrix M by multiplying in the order v*M.
 *
 * In column-major mode:
 *
 * - Columns of a matrix are sub-arrays.
 * - Individual entries of a matrix M get accessed in M[column][row] fashion.
 * - Tuples of coordinates are interpreted as column-vectors.
 * - A matrix M transforms a vector v by multiplying in the order M*v.
 *
 * When a function in o3djs.math requires separate row-major and
 * column-major versions, a function with the same name gets added to each of
 * the namespaces o3djs.math.rowMajor and o3djs.math.columnMajor. The
 * function installRowMajorFunctions() or the function
 * installColumnMajorFunctions() should get called during initialization to
 * establish the mode.  installRowMajorFunctions() works by iterating through
 * the o3djs.math.rowMajor namespace and for each function foo, setting
 * o3djs.math.foo equal to o3djs.math.rowMajor.foo.
 * installRowMajorFunctions() works the same way, iterating over the columnMajor
 * namespace.  At the end of this file, we call installRowMajorFunctions().
 *
 * Switching modes changes two things.  It changes how a matrix is encoded as an
 * array, and it changes how the entries of a matrix get interpreted.  Because
 * those two things change together, the matrix representing a given
 * transformation of space is the same JavaScript object in either mode.
 * One consequence of this is that very few functions require separate row-major
 * and column-major versions.  Typically, a function requires separate versions
 * only if it makes matrix multiplication order explicit, like
 * mulMatrixMatrix(), mulMatrixVector(), or mulVectorMatrix().  Functions which
 * create a new matrix, like scaling(), rotationZYX(), and translation() return
 * the same JavaScript object in either mode, and functions which implicitly
 * multiply like scale(), rotateZYX() and translate() modify the matrix in the
 * same way in either mode.
 *
 * The convention choice made for math functions in this library is independent
 * of the convention choice for how matrices get loaded into shaders.  That
 * convention is determined on a per-shader basis.
 *
 * Other utilities in o3djs should avoid making calls to functions that make
 * multiplication order explicit.  Instead they should appeal to functions like:
 *
 * o3djs.math.matrix4.transformPoint
 * o3djs.math.matrix4.transformDirection
 * o3djs.math.matrix4.transformNormal
 * o3djs.math.matrix4.transformVector4
 * o3djs.math.matrix4.composition
 * o3djs.math.matrix4.compose
 *
 * These functions multiply matrices implicitly and internally choose the
 * multiplication order to get the right result.  That way, utilities which use
 * o3djs.math work in either major mode.  Note that this does not necessarily
 * mean all sample code will work even if a line is added which switches major
 * modes, but it does mean that calls to o3djs still do what they are supposed
 * to.
 *
 */

o3djs.provide('o3djs.math');

/**
 * A module for math for o3djs.math.
 * @namespace
 */
o3djs.math = o3djs.math || {};

/**
 * A random seed for the pseudoRandom function.
 * @private
 * @type {number}
 */
o3djs.math.randomSeed_ = 0;

/**
 * A constant for the pseudoRandom function
 * @private
 * @type {number}
 */
o3djs.math.RANDOM_RANGE_ = Math.pow(2, 32);

/**
 * Functions which deal with 4-by-4 transformation matrices are kept in their
 * own namespsace.
 * @namespace
 */
o3djs.math.matrix4 = o3djs.math.matrix4 || {};

/**
 * Functions that are specifically row major are kept in their own namespace.
 * @namespace
 */
o3djs.math.rowMajor = o3djs.math.rowMajor || {};

/**
 * Functions that are specifically column major are kept in their own namespace.
 * @namespace
 */
o3djs.math.columnMajor = o3djs.math.columnMajor || {};

/**
 * Functions that do error checking are stored in their own namespace.
 * @namespace
 */
o3djs.math.errorCheck = o3djs.math.errorCheck || {};

/**
 * Functions that do no error checking and have a separate version that does in
 * o3djs.math.errorCheck are stored in their own namespace.
 * @namespace
 */
o3djs.math.errorCheckFree = o3djs.math.errorCheckFree || {};

/**
 * An Array of 2 floats
 * @type {(!Array.<number>|!o3d.Float2)}
 */
o3djs.math.Vector2 = goog.typedef;

/**
 * An Array of 3 floats
 * @type {(!Array.<number>|!o3d.Float3)}
 */
o3djs.math.Vector3 = goog.typedef;

/**
 * An Array of 4 floats
 * @type {(!Array.<number>|!o3d.Float4)}
 */
o3djs.math.Vector4 = goog.typedef;

/**
 * An Array of floats.
 * @type {!Array.<number>}
 */
o3djs.math.Vector = goog.typedef;

/**
 * A 1x1 Matrix of floats
 * @type {!Array.<!Array.<number>>}
 */
o3djs.math.Matrix1 = goog.typedef;

/**
 * A 2x2 Matrix of floats
 * @type {!Array.<!Array.<number>>}
 */
o3djs.math.Matrix2 = goog.typedef;

/**
 * A 3x3 Matrix of floats
 * @type {!Array.<!Array.<number>>}
 */
o3djs.math.Matrix3 = goog.typedef;

/**
 * A 4x4 Matrix of floats
 * @type {(!Array.<!Array.<number>>|!o3d.Matrix4)}
 */
o3djs.math.Matrix4 = goog.typedef;

/**
 * A arbitrary size Matrix of floats
 * @type {(!Array.<!Array.<number>>|!o3d.Matrix4)}
 */
o3djs.math.Matrix = goog.typedef;

/**
 * Returns a deterministic pseudorandom number between 0 and 1
 * @return {number} a random number between 0 and 1
 */
o3djs.math.pseudoRandom = function () {
  const math = o3djs.math;
  return (
    (math.randomSeed_ =
      (134775813 * math.randomSeed_ + 1) % math.RANDOM_RANGE_) /
    math.RANDOM_RANGE_
  );
};

/**
 * Resets the pseudoRandom function sequence.
 */
o3djs.math.resetPseudoRandom = function () {
  o3djs.math.randomSeed_ = 0;
};

/**
 * Converts degrees to radians.
 * @param {number} degrees A value in degrees.
 * @return {number} the value in radians.
 */
o3djs.math.degToRad = function (degrees) {
  return degrees * Math.PI / 180;
};

/**
 * Converts radians to degrees.
 * @param {number} radians A value in radians.
 * @return {number} the value in degrees.
 */
o3djs.math.radToDeg = function (radians) {
  return radians * 180 / Math.PI;
};

/**
 * Performs linear interpolation on two scalars.
 * Given scalars a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {number} a Operand scalar.
 * @param {number} b Operand scalar.
 * @param {number} t Interpolation coefficient.
 * @return {number} The weighted sum of a and b.
 */
o3djs.math.lerpScalar = function (a, b, t) {
  return (1 - t) * a + t * b;
};

/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @return {!o3djs.math.Vector} The sum of a and b.
 */
o3djs.math.addVector = function (a, b) {
  const r = [];
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r[i] = a[i] + b[i];
  }
  return r;
};

/**
 * Subtracts two vectors.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @return {!o3djs.math.Vector} The difference of a and b.
 */
o3djs.math.subVector = function (a, b) {
  const r = [];
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r[i] = a[i] - b[i];
  }
  return r;
};

/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @param {number} t Interpolation coefficient.
 * @return {!o3djs.math.Vector} The weighted sum of a and b.
 */
o3djs.math.lerpVector = function (a, b, t) {
  const r = [];
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r[i] = (1 - t) * a[i] + t * b[i];
  }
  return r;
};

/**
 * Clamps a value between 0 and range using a modulo.
 * @param {number} v Value to clamp mod.
 * @param {number} range Range to clamp to.
 * @param {number} opt_rangeStart start of range. Default = 0.
 * @return {number} Clamp modded value.
 */
o3djs.math.modClamp = function (v, range, opt_rangeStart) {
  const start = opt_rangeStart || 0;
  if (range < 0.00001) {
    return start;
  }
  v -= start;
  if (v < 0) {
    v -= Math.floor(v / range) * range;
  } else {
    v %= range;
  }
  return v + start;
};

/**
 * Lerps in a circle.
 * Does a lerp between a and b but inside range so for example if
 * range is 100, a is 95 and b is 5 lerping will go in the positive direction.
 * @param {number} a Start value.
 * @param {number} b Target value.
 * @param {number} t Amount to lerp (0 to 1).
 * @param {number} range Range of circle.
 * @return {number} lerped result.
 */
o3djs.math.lerpCircular = function (a, b, t, range) {
  a = o3djs.math.modClamp(a, range);
  b = o3djs.math.modClamp(b, range);
  const delta = b - a;
  if (Math.abs(delta) > range * 0.5) {
    if (delta > 0) {
      b -= range;
    } else {
      b += range;
    }
  }
  return o3djs.math.modClamp(o3djs.math.lerpScalar(a, b, t), range);
};

/**
 * Lerps radians.
 * @param {number} a Start value.
 * @param {number} b Target value.
 * @param {number} t Amount to lerp (0 to 1).
 * @return {number} lerped result.
 */
o3djs.math.lerpRadian = function (a, b, t) {
  return o3djs.math.lerpCircular(a, b, t, Math.PI * 2);
};

/**
 * Divides a vector by a scalar.
 * @param {!o3djs.math.Vector} v The vector.
 * @param {number} k The scalar.
 * @return {!o3djs.math.Vector} v The vector v divided by k.
 */
o3djs.math.divVectorScalar = function (v, k) {
  const r = [];
  const vLength = v.length;
  for (let i = 0; i < vLength; ++i) {
    r[i] = v[i] / k;
  }
  return r;
};

/**
 * Computes the dot product of two vectors; assumes that a and b have
 * the same dimension.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @return {number} The dot product of a and b.
 */
o3djs.math.dot = function (a, b) {
  let r = 0.0;
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r += a[i] * b[i];
  }
  return r;
};

/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @return {!o3djs.math.Vector} The vector a cross b.
 */
o3djs.math.cross = function (a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
};

/**
 * Computes the Euclidean length of a vector, i.e. the square root of the
 * sum of the squares of the entries.
 * @param {!o3djs.math.Vector} a The vector.
 * @return {number} The length of a.
 */
o3djs.math.length = function (a) {
  let r = 0.0;
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r += a[i] * a[i];
  }
  return Math.sqrt(r);
};

/**
 * Computes the square of the Euclidean length of a vector, i.e. the sum
 * of the squares of the entries.
 * @param {!o3djs.math.Vector} a The vector.
 * @return {number} The square of the length of a.
 */
o3djs.math.lengthSquared = function (a) {
  let r = 0.0;
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r += a[i] * a[i];
  }
  return r;
};

/**
 * Computes the Euclidean distance between two vectors.
 * @param {!o3djs.math.Vector} a A vector.
 * @param {!o3djs.math.Vector} b A vector.
 * @return {number} The distance between a and b.
 */
o3djs.math.distance = function (a, b) {
  let r = 0.0;
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    const t = a[i] - b[i];
    r += t * t;
  }
  return Math.sqrt(r);
};

/**
 * Computes the square of the Euclidean distance between two vectors.
 * @param {!o3djs.math.Vector} a A vector.
 * @param {!o3djs.math.Vector} b A vector.
 * @return {number} The distance between a and b.
 */
o3djs.math.distanceSquared = function (a, b) {
  let r = 0.0;
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    const t = a[i] - b[i];
    r += t * t;
  }
  return r;
};

/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param {!o3djs.math.Vector} a The vector.
 * @return {!o3djs.math.Vector} The normalized vector.
 */
o3djs.math.normalize = function (a) {
  const r = [];
  let n = 0.0;
  const aLength = a.length;
  for (var i = 0; i < aLength; ++i) {
    n += a[i] * a[i];
  }
  n = Math.sqrt(n);
  for (var i = 0; i < aLength; ++i) {
    r[i] = a[i] / n;
  }
  return r;
};

/**
 * Adds two matrices; assumes a and b are the same size.
 * @param {!o3djs.math.Matrix} a Operand matrix.
 * @param {!o3djs.math.Matrix} b Operand matrix.
 * @return {!o3djs.math.Matrix} The sum of a and b.
 */
o3djs.math.addMatrix = function (a, b) {
  const r = [];
  const aLength = a.length;
  const a0Length = a[0].length;
  for (let i = 0; i < aLength; ++i) {
    const row = [];
    const ai = a[i];
    const bi = b[i];
    for (let j = 0; j < a0Length; ++j) {
      row[j] = ai[j] + bi[j];
    }
    r[i] = row;
  }
  return r;
};

/**
 * Subtracts two matrices; assumes a and b are the same size.
 * @param {!o3djs.math.Matrix} a Operand matrix.
 * @param {!o3djs.math.Matrix} b Operand matrix.
 * @return {!o3djs.math.Matrix} The sum of a and b.
 */
o3djs.math.subMatrix = function (a, b) {
  const r = [];
  const aLength = a.length;
  const a0Length = a[0].length;
  for (let i = 0; i < aLength; ++i) {
    const row = [];
    const ai = a[i];
    const bi = b[i];
    for (let j = 0; j < a0Length; ++j) {
      row[j] = ai[j] - bi[j];
    }
    r[i] = row;
  }
  return r;
};

/**
 * Performs linear interpolation on two matrices.
 * Given matrices a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {!o3djs.math.Matrix} a Operand matrix.
 * @param {!o3djs.math.Matrix} b Operand matrix.
 * @param {number} t Interpolation coefficient.
 * @return {!o3djs.math.Matrix} The weighted of a and b.
 */
o3djs.math.lerpMatrix = function (a, b, t) {
  const r = [];
  const aLength = a.length;
  const a0Length = a[0].length;
  for (let i = 0; i < aLength; ++i) {
    const row = [];
    const ai = a[i];
    const bi = b[i];
    for (let j = 0; j < a0Length; ++j) {
      row[j] = (1 - t) * ai[j] + t * bi[j];
    }
    r[i] = row;
  }
  return r;
};

/**
 * Divides a matrix by a scalar.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} k The scalar.
 * @return {!o3djs.math.Matrix} The matrix m divided by k.
 */
o3djs.math.divMatrixScalar = function (m, k) {
  const r = [];
  const mLength = m.length;
  const m0Length = m[0].length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = [];
    for (let j = 0; j < m0Length; ++j) {
      r[i][j] = m[i][j] / k;
    }
  }
  return r;
};

/**
 * Negates a scalar.
 * @param {number} a The scalar.
 * @return {number} -a.
 */
o3djs.math.negativeScalar = function (a) {
  return -a;
};

/**
 * Negates a vector.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} -v.
 */
o3djs.math.negativeVector = function (v) {
  const r = [];
  const vLength = v.length;
  for (let i = 0; i < vLength; ++i) {
    r[i] = -v[i];
  }
  return r;
};

/**
 * Negates a matrix.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Matrix} -m.
 */
o3djs.math.negativeMatrix = function (m) {
  const r = [];
  const mLength = m.length;
  const m0Length = m[0].length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = [];
    for (let j = 0; j < m0Length; ++j) {
      r[i][j] = -m[i][j];
    }
  }
  return r;
};

/**
 * Copies a scalar.
 * @param {number} a The scalar.
 * @return {number} a.
 */
o3djs.math.copyScalar = function (a) {
  return a;
};

/**
 * Copies a vector.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} A copy of v.
 */
o3djs.math.copyVector = function (v) {
  const r = [];
  for (let i = 0; i < v.length; i++) {
    r[i] = v[i];
  }
  return r;
};

/**
 * Copies a matrix.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Matrix} A copy of m.
 */
o3djs.math.copyMatrix = function (m) {
  const r = [];
  const mLength = m.length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = [];
    for (let j = 0; j < m[i].length; j++) {
      r[i][j] = m[i][j];
    }
  }
  return r;
};

/**
 * Returns the elements of a matrix as a one-dimensional array. The
 * rows or columns (depending on whether the matrix is row-major or
 * column-major) are concatenated.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!Array.<number>} The matrix's elements as a one-dimensional array.
 */
o3djs.math.getMatrixElements = function (m) {
  const r = [];
  const mLength = m.length;
  let k = 0;
  for (let i = 0; i < mLength; i++) {
    for (let j = 0; j < m[i].length; j++) {
      r[k++] = m[i][j];
    }
  }
  return r;
};

/**
 * Multiplies two scalars.
 * @param {number} a Operand scalar.
 * @param {number} b Operand scalar.
 * @return {number} The product of a and b.
 */
o3djs.math.mulScalarScalar = function (a, b) {
  return a * b;
};

/**
 * Multiplies a scalar by a vector.
 * @param {number} k The scalar.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} The product of k and v.
 */
o3djs.math.mulScalarVector = function (k, v) {
  const r = [];
  const vLength = v.length;
  for (let i = 0; i < vLength; ++i) {
    r[i] = k * v[i];
  }
  return r;
};

/**
 * Multiplies a vector by a scalar.
 * @param {!o3djs.math.Vector} v The vector.
 * @param {number} k The scalar.
 * @return {!o3djs.math.Vector} The product of k and v.
 */
o3djs.math.mulVectorScalar = function (v, k) {
  return o3djs.math.mulScalarVector(k, v);
};

/**
 * Multiplies a scalar by a matrix.
 * @param {number} k The scalar.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Matrix} The product of m and k.
 */
o3djs.math.mulScalarMatrix = function (k, m) {
  const r = [];
  const mLength = m.length;
  const m0Length = m[0].length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = [];
    for (let j = 0; j < m0Length; ++j) {
      r[i][j] = k * m[i][j];
    }
  }
  return r;
};

/**
 * Multiplies a matrix by a scalar.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} k The scalar.
 * @return {!o3djs.math.Matrix} The product of m and k.
 */
o3djs.math.mulMatrixScalar = function (m, k) {
  return o3djs.math.mulScalarMatrix(k, m);
};

/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @return {!o3djs.math.Vector} The vector of products of entries of a and
 *     b.
 */
o3djs.math.mulVectorVector = function (a, b) {
  const r = [];
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r[i] = a[i] * b[i];
  }
  return r;
};

/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param {!o3djs.math.Vector} a Operand vector.
 * @param {!o3djs.math.Vector} b Operand vector.
 * @return {!o3djs.math.Vector} The vector of quotients of entries of a and
 *     b.
 */
o3djs.math.divVectorVector = function (a, b) {
  const r = [];
  const aLength = a.length;
  for (let i = 0; i < aLength; ++i) {
    r[i] = a[i] / b[i];
  }
  return r;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.math.Vector} v The vector.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Vector} The product of v and m as a row vector.
 */
o3djs.math.rowMajor.mulVectorMatrix = function (v, m) {
  const r = [];
  const m0Length = m[0].length;
  const vLength = v.length;
  for (let i = 0; i < m0Length; ++i) {
    r[i] = 0.0;
    for (let j = 0; j < vLength; ++j) {
      r[i] += v[j] * m[j][i];
    }
  }
  return r;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.math.Vector} v The vector.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Vector} The product of v and m as a row vector.
 */
o3djs.math.columnMajor.mulVectorMatrix = function (v, m) {
  const r = [];
  const mLength = m.length;
  const vLength = v.length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = 0.0;
    const column = m[i];
    for (let j = 0; j < vLength; ++j) {
      r[i] += v[j] * column[j];
    }
  }
  return r;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} The product of m and v as a row vector.
 */
o3djs.math.mulVectorMatrix = null;

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector.
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} The product of m and v as a column vector.
 */
o3djs.math.rowMajor.mulMatrixVector = function (m, v) {
  const r = [];
  const mLength = m.length;
  const m0Length = m[0].length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = 0.0;
    const row = m[i];
    for (let j = 0; j < m0Length; ++j) {
      r[i] += row[j] * v[j];
    }
  }
  return r;
};

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} The product of m and v as a column vector.
 */
o3djs.math.columnMajor.mulMatrixVector = function (m, v) {
  const r = [];
  const m0Length = m[0].length;
  const vLength = v.length;
  for (let i = 0; i < m0Length; ++i) {
    r[i] = 0.0;
    for (let j = 0; j < vLength; ++j) {
      r[i] += v[j] * m[j][i];
    }
  }
  return r;
};

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {!o3djs.math.Vector} v The vector.
 * @return {!o3djs.math.Vector} The product of m and v as a column vector.
 */
o3djs.math.mulMatrixVector = null;

/**
 * Multiplies two 2-by-2 matrices; assumes that the given matrices are 2-by-2;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.math.Matrix2} a The matrix on the left.
 * @param {!o3djs.math.Matrix2} b The matrix on the right.
 * @return {!o3djs.math.Matrix2} The matrix product of a and b.
 */
o3djs.math.rowMajor.mulMatrixMatrix2 = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const b0 = b[0];
  const b1 = b[1];
  const a00 = a0[0];
  const a01 = a0[1];
  const a10 = a1[0];
  const a11 = a1[1];
  const b00 = b0[0];
  const b01 = b0[1];
  const b10 = b1[0];
  const b11 = b1[1];
  return [
    [a00 * b00 + a01 * b10, a00 * b01 + a01 * b11],
    [a10 * b00 + a11 * b10, a10 * b01 + a11 * b11],
  ];
};

/**
 * Multiplies two 2-by-2 matrices; assumes that the given matrices are 2-by-2;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.math.Matrix2} a The matrix on the left.
 * @param {!o3djs.math.Matrix2} b The matrix on the right.
 * @return {!o3djs.math.Matrix2} The matrix product of a and b.
 */
o3djs.math.columnMajor.mulMatrixMatrix2 = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const b0 = b[0];
  const b1 = b[1];
  const a00 = a0[0];
  const a01 = a0[1];
  const a10 = a1[0];
  const a11 = a1[1];
  const b00 = b0[0];
  const b01 = b0[1];
  const b10 = b1[0];
  const b11 = b1[1];
  return [
    [a00 * b00 + a10 * b01, a01 * b00 + a11 * b01],
    [a00 * b10 + a10 * b11, a01 * b10 + a11 * b11],
  ];
};

/**
 * Multiplies two 2-by-2 matrices.
 * @param {!o3djs.math.Matrix2} a The matrix on the left.
 * @param {!o3djs.math.Matrix2} b The matrix on the right.
 * @return {!o3djs.math.Matrix2} The matrix product of a and b.
 */
o3djs.math.mulMatrixMatrix2 = null;

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.math.Matrix3} a The matrix on the left.
 * @param {!o3djs.math.Matrix3} b The matrix on the right.
 * @return {!o3djs.math.Matrix3} The matrix product of a and b.
 */
o3djs.math.rowMajor.mulMatrixMatrix3 = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const a00 = a0[0];
  const a01 = a0[1];
  const a02 = a0[2];
  const a10 = a1[0];
  const a11 = a1[1];
  const a12 = a1[2];
  const a20 = a2[0];
  const a21 = a2[1];
  const a22 = a2[2];
  const b00 = b0[0];
  const b01 = b0[1];
  const b02 = b0[2];
  const b10 = b1[0];
  const b11 = b1[1];
  const b12 = b1[2];
  const b20 = b2[0];
  const b21 = b2[1];
  const b22 = b2[2];
  return [
    [
      a00 * b00 + a01 * b10 + a02 * b20,
      a00 * b01 + a01 * b11 + a02 * b21,
      a00 * b02 + a01 * b12 + a02 * b22,
    ],
    [
      a10 * b00 + a11 * b10 + a12 * b20,
      a10 * b01 + a11 * b11 + a12 * b21,
      a10 * b02 + a11 * b12 + a12 * b22,
    ],
    [
      a20 * b00 + a21 * b10 + a22 * b20,
      a20 * b01 + a21 * b11 + a22 * b21,
      a20 * b02 + a21 * b12 + a22 * b22,
    ],
  ];
};

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.math.Matrix3} a The matrix on the left.
 * @param {!o3djs.math.Matrix3} b The matrix on the right.
 * @return {!o3djs.math.Matrix3} The matrix product of a and b.
 */
o3djs.math.columnMajor.mulMatrixMatrix3 = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const a00 = a0[0];
  const a01 = a0[1];
  const a02 = a0[2];
  const a10 = a1[0];
  const a11 = a1[1];
  const a12 = a1[2];
  const a20 = a2[0];
  const a21 = a2[1];
  const a22 = a2[2];
  const b00 = b0[0];
  const b01 = b0[1];
  const b02 = b0[2];
  const b10 = b1[0];
  const b11 = b1[1];
  const b12 = b1[2];
  const b20 = b2[0];
  const b21 = b2[1];
  const b22 = b2[2];
  return [
    [
      a00 * b00 + a10 * b01 + a20 * b02,
      a01 * b00 + a11 * b01 + a21 * b02,
      a02 * b00 + a12 * b01 + a22 * b02,
    ],
    [
      a00 * b10 + a10 * b11 + a20 * b12,
      a01 * b10 + a11 * b11 + a21 * b12,
      a02 * b10 + a12 * b11 + a22 * b12,
    ],
    [
      a00 * b20 + a10 * b21 + a20 * b22,
      a01 * b20 + a11 * b21 + a21 * b22,
      a02 * b20 + a12 * b21 + a22 * b22,
    ],
  ];
};

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3.
 * @param {!o3djs.math.Matrix3} a The matrix on the left.
 * @param {!o3djs.math.Matrix3} b The matrix on the right.
 * @return {!o3djs.math.Matrix3} The matrix product of a and b.
 */
o3djs.math.mulMatrixMatrix3 = null;

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!o3djs.math.Matrix4} a The matrix on the left.
 * @param {!o3djs.math.Matrix4} b The matrix on the right.
 * @return {!o3djs.math.Matrix4} The matrix product of a and b.
 */
o3djs.math.rowMajor.mulMatrixMatrix4 = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const a3 = a[3];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const b3 = b[3];
  const a00 = a0[0];
  const a01 = a0[1];
  const a02 = a0[2];
  const a03 = a0[3];
  const a10 = a1[0];
  const a11 = a1[1];
  const a12 = a1[2];
  const a13 = a1[3];
  const a20 = a2[0];
  const a21 = a2[1];
  const a22 = a2[2];
  const a23 = a2[3];
  const a30 = a3[0];
  const a31 = a3[1];
  const a32 = a3[2];
  const a33 = a3[3];
  const b00 = b0[0];
  const b01 = b0[1];
  const b02 = b0[2];
  const b03 = b0[3];
  const b10 = b1[0];
  const b11 = b1[1];
  const b12 = b1[2];
  const b13 = b1[3];
  const b20 = b2[0];
  const b21 = b2[1];
  const b22 = b2[2];
  const b23 = b2[3];
  const b30 = b3[0];
  const b31 = b3[1];
  const b32 = b3[2];
  const b33 = b3[3];
  return [
    [
      a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
      a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
      a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
      a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
    ],
    [
      a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
      a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
      a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
      a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
    ],
    [
      a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
      a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
      a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
      a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
    ],
    [
      a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
      a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
      a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
      a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33,
    ],
  ];
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!o3djs.math.Matrix4} a The matrix on the left.
 * @param {!o3djs.math.Matrix4} b The matrix on the right.
 * @return {!o3djs.math.Matrix4} The matrix product of a and b.
 */
o3djs.math.columnMajor.mulMatrixMatrix4 = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const a3 = a[3];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const b3 = b[3];
  const a00 = a0[0];
  const a01 = a0[1];
  const a02 = a0[2];
  const a03 = a0[3];
  const a10 = a1[0];
  const a11 = a1[1];
  const a12 = a1[2];
  const a13 = a1[3];
  const a20 = a2[0];
  const a21 = a2[1];
  const a22 = a2[2];
  const a23 = a2[3];
  const a30 = a3[0];
  const a31 = a3[1];
  const a32 = a3[2];
  const a33 = a3[3];
  const b00 = b0[0];
  const b01 = b0[1];
  const b02 = b0[2];
  const b03 = b0[3];
  const b10 = b1[0];
  const b11 = b1[1];
  const b12 = b1[2];
  const b13 = b1[3];
  const b20 = b2[0];
  const b21 = b2[1];
  const b22 = b2[2];
  const b23 = b2[3];
  const b30 = b3[0];
  const b31 = b3[1];
  const b32 = b3[2];
  const b33 = b3[3];
  return [
    [
      a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
      a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
      a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
      a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,
    ],
    [
      a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
      a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
      a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
      a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,
    ],
    [
      a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
      a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
      a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
      a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,
    ],
    [
      a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
      a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
      a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
      a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33,
    ],
  ];
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4.
 * @param {!o3djs.math.Matrix4} a The matrix on the left.
 * @param {!o3djs.math.Matrix4} b The matrix on the right.
 * @return {!o3djs.math.Matrix4} The matrix product of a and b.
 */
o3djs.math.mulMatrixMatrix4 = null;

/**
 * Multiplies two matrices; assumes that the sizes of the matrices are
 * appropriately compatible; assumes matrix entries are accessed in
 * [row][column] fashion.
 * @param {!o3djs.math.Matrix} a The matrix on the left.
 * @param {!o3djs.math.Matrix} b The matrix on the right.
 * @return {!o3djs.math.Matrix} The matrix product of a and b.
 */
o3djs.math.rowMajor.mulMatrixMatrix = function (a, b) {
  const r = [];
  const aRows = a.length;
  const bColumns = b[0].length;
  const bRows = b.length;
  for (let i = 0; i < aRows; ++i) {
    const v = []; // v becomes a row of the answer.
    const ai = a[i]; // ith row of a.
    for (let j = 0; j < bColumns; ++j) {
      v[j] = 0.0;
      for (let k = 0; k < bRows; ++k) {
        v[j] += ai[k] * b[k][j];
      } // kth row, jth column.
    }
    r[i] = v;
  }
  return r;
};

/**
 * Multiplies two matrices; assumes that the sizes of the matrices are
 * appropriately compatible; assumes matrix entries are accessed in
 * [row][column] fashion.
 * @param {!o3djs.math.Matrix} a The matrix on the left.
 * @param {!o3djs.math.Matrix} b The matrix on the right.
 * @return {!o3djs.math.Matrix} The matrix product of a and b.
 */
o3djs.math.columnMajor.mulMatrixMatrix = function (a, b) {
  const r = [];
  const bColumns = b.length;
  const aRows = a[0].length;
  const aColumns = a.length;
  for (let i = 0; i < bColumns; ++i) {
    const v = []; // v becomes a column of the answer.
    const bi = b[i]; // ith column of b.
    for (let j = 0; j < aRows; ++j) {
      v[j] = 0.0;
      for (let k = 0; k < aColumns; ++k) {
        v[j] += bi[k] * a[k][j];
      } // kth column, jth row.
    }
    r[i] = v;
  }
  return r;
};

/**
 * Multiplies two matrices; assumes that the sizes of the matrices are
 * appropriately compatible.
 * @param {!o3djs.math.Matrix} a The matrix on the left.
 * @param {!o3djs.math.Matrix} b The matrix on the right.
 * @return {!o3djs.math.Matrix} The matrix product of a and b.
 */
o3djs.math.mulMatrixMatrix = null;

/**
 * Gets the jth column of the given matrix m; assumes matrix entries are
 * accessed in [row][column] fashion.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!o3djs.math.Vector} The jth column of m as a vector.
 */
o3djs.math.rowMajor.column = function (m, j) {
  const r = [];
  const mLength = m.length;
  for (let i = 0; i < mLength; ++i) {
    r[i] = m[i][j];
  }
  return r;
};

/**
 * Gets the jth column of the given matrix m; assumes matrix entries are
 * accessed in [column][row] fashion.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!o3djs.math.Vector} The jth column of m as a vector.
 */
o3djs.math.columnMajor.column = function (m, j) {
  return m[j].slice();
};

/**
 * Gets the jth column of the given matrix m.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!o3djs.math.Vector} The jth column of m as a vector.
 */
o3djs.math.column = null;

/**
 * Gets the ith row of the given matrix m; assumes matrix entries are
 * accessed in [row][column] fashion.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!o3djs.math.Vector} The ith row of m.
 */
o3djs.math.rowMajor.row = function (m, i) {
  return m[i].slice();
};

/**
 * Gets the ith row of the given matrix m; assumes matrix entries are
 * accessed in [column][row] fashion.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!o3djs.math.Vector} The ith row of m.
 */
o3djs.math.columnMajor.row = function (m, i) {
  const r = [];
  const mLength = m.length;
  for (let j = 0; j < mLength; ++j) {
    r[j] = m[j][i];
  }
  return r;
};

/**
 * Gets the ith row of the given matrix m.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!o3djs.math.Vector} The ith row of m.
 */
o3djs.math.row = null;

/**
 * Creates an n-by-n identity matrix.
 * @param {number} n The dimension of the identity matrix required.
 * @return {!o3djs.math.Matrix} An n-by-n identity matrix.
 */
o3djs.math.identity = function (n) {
  const r = [];
  for (let j = 0; j < n; ++j) {
    r[j] = [];
    for (let i = 0; i < n; ++i) {
      r[j][i] = i == j ? 1 : 0;
    }
  }
  return r;
};

/**
 * Takes the transpose of a matrix.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Matrix} The transpose of m.
 */
o3djs.math.transpose = function (m) {
  const r = [];
  const m0Length = m[0].length;
  const mLength = m.length;
  for (let j = 0; j < m0Length; ++j) {
    r[j] = [];
    for (let i = 0; i < mLength; ++i) {
      r[j][i] = m[i][j];
    }
  }
  return r;
};

/**
 * Computes the trace (sum of the diagonal entries) of a square matrix;
 * assumes m is square.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {number} The trace of m.
 */
o3djs.math.trace = function (m) {
  let r = 0.0;
  const mLength = m.length;
  for (let i = 0; i < mLength; ++i) {
    r += m[i][i];
  }
  return r;
};

/**
 * Computes the determinant of a 1-by-1 matrix.
 * @param {!o3djs.math.Matrix1} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.math.det1 = function (m) {
  return m[0][0];
};

/**
 * Computes the determinant of a 2-by-2 matrix.
 * @param {!o3djs.math.Matrix2} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.math.det2 = function (m) {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
};

/**
 * Computes the determinant of a 3-by-3 matrix.
 * @param {!o3djs.math.Matrix3} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.math.det3 = function (m) {
  return (
    m[2][2] * (m[0][0] * m[1][1] - m[0][1] * m[1][0]) -
    m[2][1] * (m[0][0] * m[1][2] - m[0][2] * m[1][0]) +
    m[2][0] * (m[0][1] * m[1][2] - m[0][2] * m[1][1])
  );
};

/**
 * Computes the determinant of a 4-by-4 matrix.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.math.det4 = function (m) {
  const t01 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const t02 = m[0][0] * m[1][2] - m[0][2] * m[1][0];
  const t03 = m[0][0] * m[1][3] - m[0][3] * m[1][0];
  const t12 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
  const t13 = m[0][1] * m[1][3] - m[0][3] * m[1][1];
  const t23 = m[0][2] * m[1][3] - m[0][3] * m[1][2];
  return (
    m[3][3] * (m[2][2] * t01 - m[2][1] * t02 + m[2][0] * t12) -
    m[3][2] * (m[2][3] * t01 - m[2][1] * t03 + m[2][0] * t13) +
    m[3][1] * (m[2][3] * t02 - m[2][2] * t03 + m[2][0] * t23) -
    m[3][0] * (m[2][3] * t12 - m[2][2] * t13 + m[2][1] * t23)
  );
};

/**
 * Computes the inverse of a 1-by-1 matrix.
 * @param {!o3djs.math.Matrix1} m The matrix.
 * @return {!o3djs.math.Matrix1} The inverse of m.
 */
o3djs.math.inverse1 = function (m) {
  return [[1.0 / m[0][0]]];
};

/**
 * Computes the inverse of a 2-by-2 matrix.
 * @param {!o3djs.math.Matrix2} m The matrix.
 * @return {!o3djs.math.Matrix2} The inverse of m.
 */
o3djs.math.inverse2 = function (m) {
  const d = 1.0 / (m[0][0] * m[1][1] - m[0][1] * m[1][0]);
  return [[d * m[1][1], -d * m[0][1]], [-d * m[1][0], d * m[0][0]]];
};

/**
 * Computes the inverse of a 3-by-3 matrix.
 * @param {!o3djs.math.Matrix3} m The matrix.
 * @return {!o3djs.math.Matrix3} The inverse of m.
 */
o3djs.math.inverse3 = function (m) {
  const t00 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
  const t10 = m[0][1] * m[2][2] - m[0][2] * m[2][1];
  const t20 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
  const d = 1.0 / (m[0][0] * t00 - m[1][0] * t10 + m[2][0] * t20);
  return [
    [d * t00, -d * t10, d * t20],
    [
      -d * (m[1][0] * m[2][2] - m[1][2] * m[2][0]),
      d * (m[0][0] * m[2][2] - m[0][2] * m[2][0]),
      -d * (m[0][0] * m[1][2] - m[0][2] * m[1][0]),
    ],
    [
      d * (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
      -d * (m[0][0] * m[2][1] - m[0][1] * m[2][0]),
      d * (m[0][0] * m[1][1] - m[0][1] * m[1][0]),
    ],
  ];
};

/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {!o3djs.math.Matrix4} The inverse of m.
 */
o3djs.math.inverse4 = function (m) {
  const tmp_0 = m[2][2] * m[3][3];
  const tmp_1 = m[3][2] * m[2][3];
  const tmp_2 = m[1][2] * m[3][3];
  const tmp_3 = m[3][2] * m[1][3];
  const tmp_4 = m[1][2] * m[2][3];
  const tmp_5 = m[2][2] * m[1][3];
  const tmp_6 = m[0][2] * m[3][3];
  const tmp_7 = m[3][2] * m[0][3];
  const tmp_8 = m[0][2] * m[2][3];
  const tmp_9 = m[2][2] * m[0][3];
  const tmp_10 = m[0][2] * m[1][3];
  const tmp_11 = m[1][2] * m[0][3];
  const tmp_12 = m[2][0] * m[3][1];
  const tmp_13 = m[3][0] * m[2][1];
  const tmp_14 = m[1][0] * m[3][1];
  const tmp_15 = m[3][0] * m[1][1];
  const tmp_16 = m[1][0] * m[2][1];
  const tmp_17 = m[2][0] * m[1][1];
  const tmp_18 = m[0][0] * m[3][1];
  const tmp_19 = m[3][0] * m[0][1];
  const tmp_20 = m[0][0] * m[2][1];
  const tmp_21 = m[2][0] * m[0][1];
  const tmp_22 = m[0][0] * m[1][1];
  const tmp_23 = m[1][0] * m[0][1];

  const t0 =
    tmp_0 * m[1][1] +
    tmp_3 * m[2][1] +
    tmp_4 * m[3][1] -
    (tmp_1 * m[1][1] + tmp_2 * m[2][1] + tmp_5 * m[3][1]);
  const t1 =
    tmp_1 * m[0][1] +
    tmp_6 * m[2][1] +
    tmp_9 * m[3][1] -
    (tmp_0 * m[0][1] + tmp_7 * m[2][1] + tmp_8 * m[3][1]);
  const t2 =
    tmp_2 * m[0][1] +
    tmp_7 * m[1][1] +
    tmp_10 * m[3][1] -
    (tmp_3 * m[0][1] + tmp_6 * m[1][1] + tmp_11 * m[3][1]);
  const t3 =
    tmp_5 * m[0][1] +
    tmp_8 * m[1][1] +
    tmp_11 * m[2][1] -
    (tmp_4 * m[0][1] + tmp_9 * m[1][1] + tmp_10 * m[2][1]);

  const d = 1.0 / (m[0][0] * t0 + m[1][0] * t1 + m[2][0] * t2 + m[3][0] * t3);

  return [
    [d * t0, d * t1, d * t2, d * t3],
    [
      d *
        (tmp_1 * m[1][0] +
          tmp_2 * m[2][0] +
          tmp_5 * m[3][0] -
          (tmp_0 * m[1][0] + tmp_3 * m[2][0] + tmp_4 * m[3][0])),
      d *
        (tmp_0 * m[0][0] +
          tmp_7 * m[2][0] +
          tmp_8 * m[3][0] -
          (tmp_1 * m[0][0] + tmp_6 * m[2][0] + tmp_9 * m[3][0])),
      d *
        (tmp_3 * m[0][0] +
          tmp_6 * m[1][0] +
          tmp_11 * m[3][0] -
          (tmp_2 * m[0][0] + tmp_7 * m[1][0] + tmp_10 * m[3][0])),
      d *
        (tmp_4 * m[0][0] +
          tmp_9 * m[1][0] +
          tmp_10 * m[2][0] -
          (tmp_5 * m[0][0] + tmp_8 * m[1][0] + tmp_11 * m[2][0])),
    ],
    [
      d *
        (tmp_12 * m[1][3] +
          tmp_15 * m[2][3] +
          tmp_16 * m[3][3] -
          (tmp_13 * m[1][3] + tmp_14 * m[2][3] + tmp_17 * m[3][3])),
      d *
        (tmp_13 * m[0][3] +
          tmp_18 * m[2][3] +
          tmp_21 * m[3][3] -
          (tmp_12 * m[0][3] + tmp_19 * m[2][3] + tmp_20 * m[3][3])),
      d *
        (tmp_14 * m[0][3] +
          tmp_19 * m[1][3] +
          tmp_22 * m[3][3] -
          (tmp_15 * m[0][3] + tmp_18 * m[1][3] + tmp_23 * m[3][3])),
      d *
        (tmp_17 * m[0][3] +
          tmp_20 * m[1][3] +
          tmp_23 * m[2][3] -
          (tmp_16 * m[0][3] + tmp_21 * m[1][3] + tmp_22 * m[2][3])),
    ],
    [
      d *
        (tmp_14 * m[2][2] +
          tmp_17 * m[3][2] +
          tmp_13 * m[1][2] -
          (tmp_16 * m[3][2] + tmp_12 * m[1][2] + tmp_15 * m[2][2])),
      d *
        (tmp_20 * m[3][2] +
          tmp_12 * m[0][2] +
          tmp_19 * m[2][2] -
          (tmp_18 * m[2][2] + tmp_21 * m[3][2] + tmp_13 * m[0][2])),
      d *
        (tmp_18 * m[1][2] +
          tmp_23 * m[3][2] +
          tmp_15 * m[0][2] -
          (tmp_22 * m[3][2] + tmp_14 * m[0][2] + tmp_19 * m[1][2])),
      d *
        (tmp_22 * m[2][2] +
          tmp_16 * m[0][2] +
          tmp_21 * m[1][2] -
          (tmp_20 * m[1][2] + tmp_23 * m[2][2] + tmp_17 * m[0][2])),
    ],
  ];
};

/**
 * Computes the determinant of the cofactor matrix obtained by removal
 * of a specified row and column.  This is a helper function for the general
 * determinant and matrix inversion functions.
 * @param {!o3djs.math.Matrix} a The original matrix.
 * @param {number} x The row to be removed.
 * @param {number} y The column to be removed.
 * @return {number} The determinant of the matrix obtained by removing
 *     row x and column y from a.
 */
o3djs.math.codet = function (a, x, y) {
  const size = a.length;
  const b = [];
  let ai = 0;
  for (let bi = 0; bi < size - 1; ++bi) {
    if (ai == x) {
      ai++;
    }
    b[bi] = [];
    let aj = 0;
    for (let bj = 0; bj < size - 1; ++bj) {
      if (aj == y) {
        aj++;
      }
      b[bi][bj] = a[ai][aj];
      aj++;
    }
    ai++;
  }
  return o3djs.math.det(b);
};

/**
 * Computes the determinant of an arbitrary square matrix.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {number} the determinant of m.
 */
o3djs.math.det = function (m) {
  const d = m.length;
  if (d <= 4) {
    return o3djs.math[`det${d}`](m);
  }
  let r = 0.0;
  let sign = 1;
  const row = m[0];
  const mLength = m.length;
  for (let y = 0; y < mLength; y++) {
    r += sign * row[y] * o3djs.math.codet(m, 0, y);
    sign *= -1;
  }
  return r;
};

/**
 * Computes the inverse of an arbitrary square matrix.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Matrix} The inverse of m.
 */
o3djs.math.inverse = function (m) {
  const d = m.length;
  if (d <= 4) {
    return o3djs.math[`inverse${d}`](m);
  }
  const r = [];
  const size = m.length;
  for (let j = 0; j < size; ++j) {
    r[j] = [];
    for (let i = 0; i < size; ++i) {
      r[j][i] = ((i + j) % 2 ? -1 : 1) * o3djs.math.codet(m, i, j);
    }
  }
  return o3djs.math.divMatrixScalar(r, o3djs.math.det(m));
};

/**
 * Performs Graham-Schmidt orthogonalization on the vectors which make up the
 * given matrix and returns the result in the rows of a new matrix.  When
 * multiplying many orthogonal matrices together, errors can accumulate causing
 * the product to fail to be orthogonal.  This function can be used to correct
 * that.
 * @param {!o3djs.math.Matrix} m The matrix.
 * @return {!o3djs.math.Matrix} A matrix whose rows are obtained from the
 *     rows of m by the Graham-Schmidt process.
 */
o3djs.math.orthonormalize = function (m) {
  const r = [];
  const mLength = m.length;
  for (let i = 0; i < mLength; ++i) {
    let v = m[i];
    for (let j = 0; j < i; ++j) {
      v = o3djs.math.subVector(
        v,
        o3djs.math.mulScalarVector(o3djs.math.dot(r[j], m[i]), r[j]),
      );
    }
    r[i] = o3djs.math.normalize(v);
  }
  return r;
};

/**
 * Computes the inverse of a 4-by-4 matrix.
 * Note: It is faster to call this than o3djs.math.inverse.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {!o3djs.math.Matrix4} The inverse of m.
 */
o3djs.math.matrix4.inverse = function (m) {
  return o3djs.math.inverse4(m);
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4.
 * Note: It is faster to call this than o3djs.math.mul.
 * @param {!o3djs.math.Matrix4} a The matrix on the left.
 * @param {!o3djs.math.Matrix4} b The matrix on the right.
 * @return {!o3djs.math.Matrix4} The matrix product of a and b.
 */
o3djs.math.matrix4.mul = function (a, b) {
  return o3djs.math.mulMatrixMatrix4(a, b);
};

/**
 * Computes the determinant of a 4-by-4 matrix.
 * Note: It is faster to call this than o3djs.math.det.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {number} The determinant of m.
 */
o3djs.math.matrix4.det = function (m) {
  return o3djs.math.det4(m);
};

/**
 * Copies a Matrix4.
 * Note: It is faster to call this than o3djs.math.copy.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {!o3djs.math.Matrix4} A copy of m.
 */
o3djs.math.matrix4.copy = function (m) {
  return o3djs.math.copyMatrix(m);
};

/**
 * Sets the upper 3-by-3 block of matrix a to the upper 3-by-3 block of matrix
 * b; assumes that a and b are big enough to contain an upper 3-by-3 block.
 * @param {!o3djs.math.Matrix4} a A matrix.
 * @param {!o3djs.math.Matrix3} b A 3-by-3 matrix.
 * @return {!o3djs.math.Matrix4} a once modified.
 */
o3djs.math.matrix4.setUpper3x3 = function (a, b) {
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];

  a[0].splice(0, 3, b0[0], b0[1], b0[2]);
  a[1].splice(0, 3, b1[0], b1[1], b1[2]);
  a[2].splice(0, 3, b2[0], b2[1], b2[2]);

  return a;
};

/**
 * Returns a 3-by-3 matrix mimicking the upper 3-by-3 block of m; assumes m
 * is big enough to contain an upper 3-by-3 block.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {!o3djs.math.Matrix3} The upper 3-by-3 block of m.
 */
o3djs.math.matrix4.getUpper3x3 = function (m) {
  return [m[0].slice(0, 3), m[1].slice(0, 3), m[2].slice(0, 3)];
};

/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param {!o3djs.math.Matrix4} a The matrix.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} v The vector.
 * @return {!o3djs.math.Matrix4} a once modified.
 */
o3djs.math.matrix4.setTranslation = function (a, v) {
  a[3].splice(0, 4, v[0], v[1], v[2], 1);
  return a;
};

/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @return {!o3djs.math.Vector3} The translation component of m.
 */
o3djs.math.matrix4.getTranslation = function (m) {
  return m[3].slice(0, 3);
};

/**
 * Takes a 4-by-4 matrix and a vector with 3 entries,
 * interprets the vector as a point, transforms that point by the matrix, and
 * returns the result as a vector with 3 entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector3} v The point.
 * @return {!o3djs.math.Vector3} The transformed point.
 */
o3djs.math.matrix4.transformPoint = function (m, v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];

  const d = v0 * m0[3] + v1 * m1[3] + v2 * m2[3] + m3[3];
  return [
    (v0 * m0[0] + v1 * m1[0] + v2 * m2[0] + m3[0]) / d,
    (v0 * m0[1] + v1 * m1[1] + v2 * m2[1] + m3[1]) / d,
    (v0 * m0[2] + v1 * m1[2] + v2 * m2[2] + m3[2]) / d,
  ];
};

/**
 * Takes a 4-by-4 matrix and a vector with 4 entries, transforms that vector by
 * the matrix, and returns the result as a vector with 4 entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector4} v The point in homogenous coordinates.
 * @return {!o3djs.math.Vector4} The transformed point in homogenous
 *     coordinates.
 */
o3djs.math.matrix4.transformVector4 = function (m, v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];

  return [
    v0 * m0[0] + v1 * m1[0] + v2 * m2[0] + v3 * m3[0],
    v0 * m0[1] + v1 * m1[1] + v2 * m2[1] + v3 * m3[1],
    v0 * m0[2] + v1 * m1[2] + v2 * m2[2] + v3 * m3[2],
    v0 * m0[3] + v1 * m1[3] + v2 * m2[3] + v3 * m3[3],
  ];
};

/**
 * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
 * direction, transforms that direction by the matrix, and returns the result;
 * assumes the transformation of 3-dimensional space represented by the matrix
 * is parallel-preserving, i.e. any combination of rotation, scaling and
 * translation, but not a perspective distortion. Returns a vector with 3
 * entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector3} v The direction.
 * @return {!o3djs.math.Vector3} The transformed direction.
 */
o3djs.math.matrix4.transformDirection = function (m, v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];

  return [
    v0 * m0[0] + v1 * m1[0] + v2 * m2[0],
    v0 * m0[1] + v1 * m1[1] + v2 * m2[1],
    v0 * m0[2] + v1 * m1[2] + v2 * m2[2],
  ];
};

/**
 * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
 * as a normal to a surface, and computes a vector which is normal upon
 * transforming that surface by the matrix. The effect of this function is the
 * same as transforming v (as a direction) by the inverse-transpose of m.  This
 * function assumes the transformation of 3-dimensional space represented by the
 * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
 * translation, but not a perspective distortion.  Returns a vector with 3
 * entries.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector3} v The normal.
 * @return {!o3djs.math.Vector3} The transformed normal.
 */
o3djs.math.matrix4.transformNormal = function (m, v) {
  const mInverse = o3djs.math.inverse4(m);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const mi0 = mInverse[0];
  const mi1 = mInverse[1];
  const mi2 = mInverse[2];
  const mi3 = mInverse[3];

  return [
    v0 * mi0[0] + v1 * mi0[1] + v2 * mi0[2],
    v0 * mi1[0] + v1 * mi1[1] + v2 * mi1[2],
    v0 * mi2[0] + v1 * mi2[1] + v2 * mi2[2],
  ];
};

/**
 * Creates a 4-by-4 identity matrix.
 * @return {!o3djs.math.Matrix4} The 4-by-4 identity.
 */
o3djs.math.matrix4.identity = function () {
  return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
};

/**
 * Sets the given 4-by-4 matrix to the identity matrix.
 * @param {!o3djs.math.Matrix4} m The matrix to set to identity.
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.setIdentity = function (m) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i == j) {
        m[i][j] = 1;
      } else {
        m[i][j] = 0;
      }
    }
  }
  return m;
};

/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 * @param {number} angle The camera angle from top to bottom (in radians).
 * @param {number} aspect The aspect ratio width / height.
 * @param {number} near The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param {number} far The depth (negative z coordinate)
 *     of the far clipping plane.
 * @return {!o3djs.math.Matrix4} The perspective matrix.
 */
o3djs.math.matrix4.perspective = function (angle, aspect, near, far) {
  const f = Math.tan(0.5 * (Math.PI - angle));
  const range = near - far;

  return [
    [f / aspect, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, far / range, -1],
    [0, 0, near * far / range, 0],
  ];
};

/**
 * Computes a 4-by-4 orthographic projection matrix given the coordinates of the
 * planes defining the axis-aligned, box-shaped viewing volume.  The matrix
 * generated sends that box to the unit box.  Note that although left and right
 * are x coordinates and bottom and top are y coordinates, near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  We assume a unit box extending from -1 to 1 in the x and y
 * dimensions and from 0 to 1 in the z dimension.
 * @param {number} left The x coordinate of the left plane of the box.
 * @param {number} right The x coordinate of the right plane of the box.
 * @param {number} bottom The y coordinate of the bottom plane of the box.
 * @param {number} top The y coordinate of the right plane of the box.
 * @param {number} near The negative z coordinate of the near plane of the box.
 * @param {number} far The negative z coordinate of the far plane of the box.
 * @return {!o3djs.math.Matrix4} The orthographic projection matrix.
 */
o3djs.math.matrix4.orthographic = function (
  left,
  right,
  bottom,
  top,
  near,
  far,
) {
  return [
    [2 / (right - left), 0, 0, 0],
    [0, 2 / (top - bottom), 0, 0],
    [0, 0, 1 / (near - far), 0],
    [
      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      near / (near - far),
      1,
    ],
  ];
};

/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param {number} left The x coordinate of the left plane of the box.
 * @param {number} right The x coordinate of the right plane of the box.
 * @param {number} bottom The y coordinate of the bottom plane of the box.
 * @param {number} top The y coordinate of the right plane of the box.
 * @param {number} near The negative z coordinate of the near plane of the box.
 * @param {number} far The negative z coordinate of the far plane of the box.
 * @return {!o3djs.math.Matrix4} The perspective projection matrix.
 */
o3djs.math.matrix4.frustum = function (left, right, bottom, top, near, far) {
  const dx = right - left;
  const dy = top - bottom;
  const dz = near - far;
  return [
    [2 * near / dx, 0, 0, 0],
    [0, 2 * near / dy, 0, 0],
    [(left + right) / dx, (top + bottom) / dy, far / dz, -1],
    [0, 0, near * far / dz, 0],
  ];
};

/**
 * Computes a 4-by-4 look-at transformation.  The transformation generated is
 * an orthogonal rotation matrix with translation component.  The translation
 * component sends the eye to the origin.  The rotation component sends the
 * vector pointing from the eye to the target to a vector pointing in the
 * negative z direction, and also sends the up vector into the upper half of
 * the yz plane.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} eye The position
 *     of the eye.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} target The
 *     position meant to be viewed.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} up A vector
 *     pointing up.
 * @return {!o3djs.math.Matrix4} The look-at matrix.
 */
o3djs.math.matrix4.lookAt = function (eye, target, up) {
  const vz = o3djs.math
    .normalize(o3djs.math.subVector(eye, target).slice(0, 3))
    .concat(0);
  const vx = o3djs.math.normalize(o3djs.math.cross(up, vz)).concat(0);
  const vy = o3djs.math.cross(vz, vx).concat(0);

  return o3djs.math.inverse([vx, vy, vz, eye.concat(1)]);
};

/**
 * Takes two 4-by-4 matrices, a and b, and computes the product in the order
 * that pre-composes b with a.  In other words, the matrix returned will
 * transform by b first and then a.  Note this is subtly different from just
 * multiplying the matrices together.  For given a and b, this function returns
 * the same object in both row-major and column-major mode.
 * @param {!o3djs.math.Matrix4} a A 4-by-4 matrix.
 * @param {!o3djs.math.Matrix4} b A 4-by-4 matrix.
 * @return {!o3djs.math.Matrix4} the composition of a and b, b first then a.
 */
o3djs.math.matrix4.composition = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const a3 = a[3];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const b3 = b[3];
  const a00 = a0[0];
  const a01 = a0[1];
  const a02 = a0[2];
  const a03 = a0[3];
  const a10 = a1[0];
  const a11 = a1[1];
  const a12 = a1[2];
  const a13 = a1[3];
  const a20 = a2[0];
  const a21 = a2[1];
  const a22 = a2[2];
  const a23 = a2[3];
  const a30 = a3[0];
  const a31 = a3[1];
  const a32 = a3[2];
  const a33 = a3[3];
  const b00 = b0[0];
  const b01 = b0[1];
  const b02 = b0[2];
  const b03 = b0[3];
  const b10 = b1[0];
  const b11 = b1[1];
  const b12 = b1[2];
  const b13 = b1[3];
  const b20 = b2[0];
  const b21 = b2[1];
  const b22 = b2[2];
  const b23 = b2[3];
  const b30 = b3[0];
  const b31 = b3[1];
  const b32 = b3[2];
  const b33 = b3[3];
  return [
    [
      a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
      a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
      a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
      a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,
    ],
    [
      a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
      a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
      a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
      a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,
    ],
    [
      a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
      a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
      a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
      a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,
    ],
    [
      a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
      a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
      a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
      a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33,
    ],
  ];
};

/**
 * Takes two 4-by-4 matrices, a and b, and modifies a to be the product in the
 * order that pre-composes b with a.  The matrix a, upon modification will
 * transform by b first and then a.  Note this is subtly different from just
 * multiplying the matrices together.  For given a and b, a, upon modification,
 * will be the same object in both row-major and column-major mode.
 * @param {!o3djs.math.Matrix4} a A 4-by-4 matrix.
 * @param {!o3djs.math.Matrix4} b A 4-by-4 matrix.
 * @return {!o3djs.math.Matrix4} a once modified.
 */
o3djs.math.matrix4.compose = function (a, b) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const a3 = a[3];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const b3 = b[3];
  const a00 = a0[0];
  const a01 = a0[1];
  const a02 = a0[2];
  const a03 = a0[3];
  const a10 = a1[0];
  const a11 = a1[1];
  const a12 = a1[2];
  const a13 = a1[3];
  const a20 = a2[0];
  const a21 = a2[1];
  const a22 = a2[2];
  const a23 = a2[3];
  const a30 = a3[0];
  const a31 = a3[1];
  const a32 = a3[2];
  const a33 = a3[3];
  const b00 = b0[0];
  const b01 = b0[1];
  const b02 = b0[2];
  const b03 = b0[3];
  const b10 = b1[0];
  const b11 = b1[1];
  const b12 = b1[2];
  const b13 = b1[3];
  const b20 = b2[0];
  const b21 = b2[1];
  const b22 = b2[2];
  const b23 = b2[3];
  const b30 = b3[0];
  const b31 = b3[1];
  const b32 = b3[2];
  const b33 = b3[3];
  a[0].splice(
    0,
    4,
    a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
    a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
    a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
    a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,
  );
  a[1].splice(
    0,
    4,
    a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
    a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
    a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
    a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,
  );
  a[2].splice(
    0,
    4,
    a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
    a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
    a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
    a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,
  ),
  a[3].splice(
    0,
    4,
    a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
    a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
    a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
    a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33,
  );
  return a;
};

/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} v The vector by
 *     which to translate.
 * @return {!o3djs.math.Matrix4} The translation matrix.
 */
o3djs.math.matrix4.translation = function (v) {
  return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [v[0], v[1], v[2], 1]];
};

/**
 * Modifies the given 4-by-4 matrix by translation by the given vector v.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} v The vector by
 *     which to translate.
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.translate = function (m, v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];
  const m00 = m0[0];
  const m01 = m0[1];
  const m02 = m0[2];
  const m03 = m0[3];
  const m10 = m1[0];
  const m11 = m1[1];
  const m12 = m1[2];
  const m13 = m1[3];
  const m20 = m2[0];
  const m21 = m2[1];
  const m22 = m2[2];
  const m23 = m2[3];
  const m30 = m3[0];
  const m31 = m3[1];
  const m32 = m3[2];
  const m33 = m3[3];

  m3.splice(
    0,
    4,
    m00 * v0 + m10 * v1 + m20 * v2 + m30,
    m01 * v0 + m11 * v1 + m21 * v2 + m31,
    m02 * v0 + m12 * v1 + m22 * v2 + m32,
    m03 * v0 + m13 * v1 + m23 * v2 + m33,
  );

  return m;
};

/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param {!o3djs.math.Vector3} v A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @return {!o3djs.math.Matrix4} The scaling matrix.
 */
o3djs.math.matrix4.scaling = function (v) {
  return [[v[0], 0, 0, 0], [0, v[1], 0, 0], [0, 0, v[2], 0], [0, 0, 0, 1]];
};

/**
 * Modifies the given 4-by-4 matrix, scaling in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param {!o3djs.math.Matrix4} m The matrix to be modified.
 * @param {!o3djs.math.Vector3} v A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.scale = function (m, v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];

  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];

  m0.splice(0, 4, v0 * m0[0], v0 * m0[1], v0 * m0[2], v0 * m0[3]);
  m1.splice(0, 4, v1 * m1[0], v1 * m1[1], v1 * m1[2], v1 * m1[3]);
  m2.splice(0, 4, v2 * m2[0], v2 * m2[1], v2 * m2[2], v2 * m2[3]);

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} The rotation matrix.
 */
o3djs.math.matrix4.rotationX = function (angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return [[1, 0, 0, 0], [0, c, s, 0], [0, -s, c, 0], [0, 0, 0, 1]];
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the x-axis by the given
 * angle.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.rotateX = function (m, angle) {
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];
  const m10 = m1[0];
  const m11 = m1[1];
  const m12 = m1[2];
  const m13 = m1[3];
  const m20 = m2[0];
  const m21 = m2[1];
  const m22 = m2[2];
  const m23 = m2[3];
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  m1.splice(
    0,
    4,
    c * m10 + s * m20,
    c * m11 + s * m21,
    c * m12 + s * m22,
    c * m13 + s * m23,
  );
  m2.splice(
    0,
    4,
    c * m20 - s * m10,
    c * m21 - s * m11,
    c * m22 - s * m12,
    c * m23 - s * m13,
  );

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} The rotation matrix.
 */
o3djs.math.matrix4.rotationY = function (angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return [[c, 0, -s, 0], [0, 1, 0, 0], [s, 0, c, 0], [0, 0, 0, 1]];
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the y-axis by the given
 * angle.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.rotateY = function (m, angle) {
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];
  const m00 = m0[0];
  const m01 = m0[1];
  const m02 = m0[2];
  const m03 = m0[3];
  const m20 = m2[0];
  const m21 = m2[1];
  const m22 = m2[2];
  const m23 = m2[3];
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  m0.splice(
    0,
    4,
    c * m00 - s * m20,
    c * m01 - s * m21,
    c * m02 - s * m22,
    c * m03 - s * m23,
  );
  m2.splice(
    0,
    4,
    c * m20 + s * m00,
    c * m21 + s * m01,
    c * m22 + s * m02,
    c * m23 + s * m03,
  );

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} The rotation matrix.
 */
o3djs.math.matrix4.rotationZ = function (angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return [[c, s, 0, 0], [-s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the z-axis by the given
 * angle.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.rotateZ = function (m, angle) {
  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];
  const m00 = m0[0];
  const m01 = m0[1];
  const m02 = m0[2];
  const m03 = m0[3];
  const m10 = m1[0];
  const m11 = m1[1];
  const m12 = m1[2];
  const m13 = m1[3];
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  m0.splice(
    0,
    4,
    c * m00 + s * m10,
    c * m01 + s * m11,
    c * m02 + s * m12,
    c * m03 + s * m13,
  );
  m1.splice(
    0,
    4,
    c * m10 - s * m00,
    c * m11 - s * m01,
    c * m12 - s * m02,
    c * m13 - s * m03,
  );

  return m;
};

/**
 * Creates a 4-by-4 rotation matrix.  Interprets the entries of the given
 * vector as angles by which to rotate around the x, y and z axes, returns a
 * a matrix which rotates around the x-axis first, then the y-axis, then the
 * z-axis.
 * @param {!o3djs.math.Vector3} v A vector of angles (in radians).
 * @return {!o3djs.math.Matrix4} The rotation matrix.
 */
o3djs.math.matrix4.rotationZYX = function (v) {
  const sinx = Math.sin(v[0]);
  const cosx = Math.cos(v[0]);
  const siny = Math.sin(v[1]);
  const cosy = Math.cos(v[1]);
  const sinz = Math.sin(v[2]);
  const cosz = Math.cos(v[2]);

  const coszsiny = cosz * siny;
  const sinzsiny = sinz * siny;

  return [
    [cosz * cosy, sinz * cosy, -siny, 0],
    [
      coszsiny * sinx - sinz * cosx,
      sinzsiny * sinx + cosz * cosx,
      cosy * sinx,
      0,
    ],
    [
      coszsiny * cosx + sinz * sinx,
      sinzsiny * cosx - cosz * sinx,
      cosy * cosx,
      0,
    ],
    [0, 0, 0, 1],
  ];
};

/**
 * Modifies a 4-by-4 matrix by a rotation.  Interprets the coordinates of the
 * given vector as angles by which to rotate around the x, y and z axes, rotates
 * around the x-axis first, then the y-axis, then the z-axis.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {!o3djs.math.Vector3} v A vector of angles (in radians).
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.rotateZYX = function (m, v) {
  const sinX = Math.sin(v[0]);
  const cosX = Math.cos(v[0]);
  const sinY = Math.sin(v[1]);
  const cosY = Math.cos(v[1]);
  const sinZ = Math.sin(v[2]);
  const cosZ = Math.cos(v[2]);

  const cosZSinY = cosZ * sinY;
  const sinZSinY = sinZ * sinY;

  const r00 = cosZ * cosY;
  const r01 = sinZ * cosY;
  const r02 = -sinY;
  const r10 = cosZSinY * sinX - sinZ * cosX;
  const r11 = sinZSinY * sinX + cosZ * cosX;
  const r12 = cosY * sinX;
  const r20 = cosZSinY * cosX + sinZ * sinX;
  const r21 = sinZSinY * cosX - cosZ * sinX;
  const r22 = cosY * cosX;

  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];

  const m00 = m0[0];
  const m01 = m0[1];
  const m02 = m0[2];
  const m03 = m0[3];
  const m10 = m1[0];
  const m11 = m1[1];
  const m12 = m1[2];
  const m13 = m1[3];
  const m20 = m2[0];
  const m21 = m2[1];
  const m22 = m2[2];
  const m23 = m2[3];
  const m30 = m3[0];
  const m31 = m3[1];
  const m32 = m3[2];
  const m33 = m3[3];

  m0.splice(
    0,
    4,
    r00 * m00 + r01 * m10 + r02 * m20,
    r00 * m01 + r01 * m11 + r02 * m21,
    r00 * m02 + r01 * m12 + r02 * m22,
    r00 * m03 + r01 * m13 + r02 * m23,
  );

  m1.splice(
    0,
    4,
    r10 * m00 + r11 * m10 + r12 * m20,
    r10 * m01 + r11 * m11 + r12 * m21,
    r10 * m02 + r11 * m12 + r12 * m22,
    r10 * m03 + r11 * m13 + r12 * m23,
  );

  m2.splice(
    0,
    4,
    r20 * m00 + r21 * m10 + r22 * m20,
    r20 * m01 + r21 * m11 + r22 * m21,
    r20 * m02 + r21 * m12 + r22 * m22,
    r20 * m03 + r21 * m13 + r22 * m23,
  );

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} axis The axis
 *     about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} A matrix which rotates angle radians
 *     around the axis.
 */
o3djs.math.matrix4.axisRotation = function (axis, angle) {
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const oneMinusCosine = 1 - c;

  return [
    [
      xx + (1 - xx) * c,
      x * y * oneMinusCosine + z * s,
      x * z * oneMinusCosine - y * s,
      0,
    ],
    [
      x * y * oneMinusCosine - z * s,
      yy + (1 - yy) * c,
      y * z * oneMinusCosine + x * s,
      0,
    ],
    [
      x * z * oneMinusCosine + y * s,
      y * z * oneMinusCosine - x * s,
      zz + (1 - zz) * c,
      0,
    ],
    [0, 0, 0, 1],
  ];
};

/**
 * Modifies the given 4-by-4 matrix by rotation around the given axis by the
 * given angle.
 * @param {!o3djs.math.Matrix4} m The matrix.
 * @param {(!o3djs.math.Vector3|!o3djs.math.Vector4)} axis The axis
 *     about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!o3djs.math.Matrix4} m once modified.
 */
o3djs.math.matrix4.axisRotate = function (m, axis, angle) {
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const oneMinusCosine = 1 - c;

  const r00 = xx + (1 - xx) * c;
  const r01 = x * y * oneMinusCosine + z * s;
  const r02 = x * z * oneMinusCosine - y * s;
  const r10 = x * y * oneMinusCosine - z * s;
  const r11 = yy + (1 - yy) * c;
  const r12 = y * z * oneMinusCosine + x * s;
  const r20 = x * z * oneMinusCosine + y * s;
  const r21 = y * z * oneMinusCosine - x * s;
  const r22 = zz + (1 - zz) * c;

  const m0 = m[0];
  const m1 = m[1];
  const m2 = m[2];
  const m3 = m[3];

  const m00 = m0[0];
  const m01 = m0[1];
  const m02 = m0[2];
  const m03 = m0[3];
  const m10 = m1[0];
  const m11 = m1[1];
  const m12 = m1[2];
  const m13 = m1[3];
  const m20 = m2[0];
  const m21 = m2[1];
  const m22 = m2[2];
  const m23 = m2[3];
  const m30 = m3[0];
  const m31 = m3[1];
  const m32 = m3[2];
  const m33 = m3[3];

  m0.splice(
    0,
    4,
    r00 * m00 + r01 * m10 + r02 * m20,
    r00 * m01 + r01 * m11 + r02 * m21,
    r00 * m02 + r01 * m12 + r02 * m22,
    r00 * m03 + r01 * m13 + r02 * m23,
  );

  m1.splice(
    0,
    4,
    r10 * m00 + r11 * m10 + r12 * m20,
    r10 * m01 + r11 * m11 + r12 * m21,
    r10 * m02 + r11 * m12 + r12 * m22,
    r10 * m03 + r11 * m13 + r12 * m23,
  );

  m2.splice(
    0,
    4,
    r20 * m00 + r21 * m10 + r22 * m20,
    r20 * m01 + r21 * m11 + r22 * m21,
    r20 * m02 + r21 * m12 + r22 * m22,
    r20 * m03 + r21 * m13 + r22 * m23,
  );

  return m;
};

/**
 * Sets each function in the namespace o3djs.math to the row major
 * version in o3djs.math.rowMajor (provided such a function exists in
 * o3djs.math.rowMajor).  Call this function to establish the row major
 * convention.
 */
o3djs.math.installRowMajorFunctions = function () {
  for (const f in o3djs.math.rowMajor) {
    o3djs.math[f] = o3djs.math.rowMajor[f];
  }
};

/**
 * Sets each function in the namespace o3djs.math to the column major
 * version in o3djs.math.columnMajor (provided such a function exists in
 * o3djs.math.columnMajor).  Call this function to establish the column
 * major convention.
 */
o3djs.math.installColumnMajorFunctions = function () {
  for (const f in o3djs.math.columnMajor) {
    o3djs.math[f] = o3djs.math.columnMajor[f];
  }
};

/**
 * Sets each function in the namespace o3djs.math to the error checking
 * version in o3djs.math.errorCheck (provided such a function exists in
 * o3djs.math.errorCheck).
 */
o3djs.math.installErrorCheckFunctions = function () {
  for (const f in o3djs.math.errorCheck) {
    o3djs.math[f] = o3djs.math.errorCheck[f];
  }
};

/**
 * Sets each function in the namespace o3djs.math to the error checking free
 * version in o3djs.math.errorCheckFree (provided such a function exists in
 * o3djs.math.errorCheckFree).
 */
o3djs.math.installErrorCheckFreeFunctions = function () {
  for (const f in o3djs.math.errorCheckFree) {
    o3djs.math[f] = o3djs.math.errorCheckFree[f];
  }
};

// By default, install the row-major functions.
o3djs.math.installRowMajorFunctions();

// By default, install prechecking.
o3djs.math.installErrorCheckFunctions();
