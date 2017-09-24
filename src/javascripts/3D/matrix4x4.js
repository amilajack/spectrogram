/*
 * Based on sample code from the OpenGL(R) ES 2.0 Programming Guide, which carriers
 * the following header:
 *
 * Book:      OpenGL(R) ES 2.0 Programming Guide
 * Authors:   Aaftab Munshi, Dan Ginsburg, Dave Shreiner
 * ISBN-10:   0321502795
 * ISBN-13:   9780321502797
 * Publisher: Addison-Wesley Professional
 * URLs:      http://safari.informit.com/9780321563835
 *            http://www.opengles-book.com
 */

//
// A simple 4x4 Matrix utility class
//

export default class Matrix4x4 {
  constructor() {
    this.elements = Array(16);
    this.loadIdentity();
  }

  scale(sx, sy, sz) {
    this.elements[0 * 4 + 0] *= sx;
    this.elements[0 * 4 + 1] *= sx;
    this.elements[0 * 4 + 2] *= sx;
    this.elements[0 * 4 + 3] *= sx;

    this.elements[1 * 4 + 0] *= sy;
    this.elements[1 * 4 + 1] *= sy;
    this.elements[1 * 4 + 2] *= sy;
    this.elements[1 * 4 + 3] *= sy;

    this.elements[2 * 4 + 0] *= sz;
    this.elements[2 * 4 + 1] *= sz;
    this.elements[2 * 4 + 2] *= sz;
    this.elements[2 * 4 + 3] *= sz;

    return this;
  }

  translate(tx, ty, tz) {
    this.elements[3 * 4 + 0] +=
      this.elements[0 * 4 + 0] * tx +
      this.elements[1 * 4 + 0] * ty +
      this.elements[2 * 4 + 0] * tz;
    this.elements[3 * 4 + 1] +=
      this.elements[0 * 4 + 1] * tx +
      this.elements[1 * 4 + 1] * ty +
      this.elements[2 * 4 + 1] * tz;
    this.elements[3 * 4 + 2] +=
      this.elements[0 * 4 + 2] * tx +
      this.elements[1 * 4 + 2] * ty +
      this.elements[2 * 4 + 2] * tz;
    this.elements[3 * 4 + 3] +=
      this.elements[0 * 4 + 3] * tx +
      this.elements[1 * 4 + 3] * ty +
      this.elements[2 * 4 + 3] * tz;

    return this;
  }

  rotate(angle, x, y, z) {
    const mag = Math.sqrt(x * x + y * y + z * z);
    const sinAngle = Math.sin(angle * Math.PI / 180.0);
    const cosAngle = Math.cos(angle * Math.PI / 180.0);

    if (mag > 0) {
      let xx;
      let yy;
      let zz;
      let xy;
      let yz;
      let zx;
      let xs;
      let ys;
      let zs;
      let oneMinusCos;
      let rotMat;

      x /= mag;
      y /= mag;
      z /= mag;

      xx = x * x;
      yy = y * y;
      zz = z * z;
      xy = x * y;
      yz = y * z;
      zx = z * x;
      xs = x * sinAngle;
      ys = y * sinAngle;
      zs = z * sinAngle;
      oneMinusCos = 1.0 - cosAngle;

      rotMat = new Matrix4x4();

      rotMat.elements[0 * 4 + 0] = oneMinusCos * xx + cosAngle;
      rotMat.elements[0 * 4 + 1] = oneMinusCos * xy - zs;
      rotMat.elements[0 * 4 + 2] = oneMinusCos * zx + ys;
      rotMat.elements[0 * 4 + 3] = 0.0;

      rotMat.elements[1 * 4 + 0] = oneMinusCos * xy + zs;
      rotMat.elements[1 * 4 + 1] = oneMinusCos * yy + cosAngle;
      rotMat.elements[1 * 4 + 2] = oneMinusCos * yz - xs;
      rotMat.elements[1 * 4 + 3] = 0.0;

      rotMat.elements[2 * 4 + 0] = oneMinusCos * zx - ys;
      rotMat.elements[2 * 4 + 1] = oneMinusCos * yz + xs;
      rotMat.elements[2 * 4 + 2] = oneMinusCos * zz + cosAngle;
      rotMat.elements[2 * 4 + 3] = 0.0;

      rotMat.elements[3 * 4 + 0] = 0.0;
      rotMat.elements[3 * 4 + 1] = 0.0;
      rotMat.elements[3 * 4 + 2] = 0.0;
      rotMat.elements[3 * 4 + 3] = 1.0;

      rotMat = rotMat.multiply(this);
      this.elements = rotMat.elements;
    }

    return this;
  }

  frustum(left, right, bottom, top, nearZ, farZ) {
    const deltaX = right - left;
    const deltaY = top - bottom;
    const deltaZ = farZ - nearZ;
    let frust;

    if (
      nearZ <= 0.0 ||
      farZ <= 0.0 ||
      deltaX <= 0.0 ||
      deltaY <= 0.0 ||
      deltaZ <= 0.0
    ) {
      return this;
    }

    frust = new Matrix4x4();

    frust.elements[0 * 4 + 0] = 2.0 * nearZ / deltaX;
    frust.elements[0 * 4 + 1] = frust.elements[0 * 4 + 2] = frust.elements[
      0 * 4 + 3
    ] = 0.0;

    frust.elements[1 * 4 + 1] = 2.0 * nearZ / deltaY;
    frust.elements[1 * 4 + 0] = frust.elements[1 * 4 + 2] = frust.elements[
      1 * 4 + 3
    ] = 0.0;

    frust.elements[2 * 4 + 0] = (right + left) / deltaX;
    frust.elements[2 * 4 + 1] = (top + bottom) / deltaY;
    frust.elements[2 * 4 + 2] = -(nearZ + farZ) / deltaZ;
    frust.elements[2 * 4 + 3] = -1.0;

    frust.elements[3 * 4 + 2] = -2.0 * nearZ * farZ / deltaZ;
    frust.elements[3 * 4 + 0] = frust.elements[3 * 4 + 1] = frust.elements[
      3 * 4 + 3
    ] = 0.0;

    frust = frust.multiply(this);
    this.elements = frust.elements;

    return this;
  }

  perspective(fovy, aspect, nearZ, farZ) {
    const frustumH = Math.tan(fovy / 360.0 * Math.PI) * nearZ;
    const frustumW = frustumH * aspect;

    return this.frustum(-frustumW, frustumW, -frustumH, frustumH, nearZ, farZ);
  }

  ortho(left, right, bottom, top, nearZ, farZ) {
    const deltaX = right - left;
    const deltaY = top - bottom;
    const deltaZ = farZ - nearZ;

    let ortho = new Matrix4x4();

    if (deltaX === 0.0 || deltaY === 0.0 || deltaZ === 0.0) {
      return this;
    }

    ortho.elements[0 * 4 + 0] = 2.0 / deltaX;
    ortho.elements[3 * 4 + 0] = -(right + left) / deltaX;
    ortho.elements[1 * 4 + 1] = 2.0 / deltaY;
    ortho.elements[3 * 4 + 1] = -(top + bottom) / deltaY;
    ortho.elements[2 * 4 + 2] = -2.0 / deltaZ;
    ortho.elements[3 * 4 + 2] = -(nearZ + farZ) / deltaZ;

    ortho = ortho.multiply(this);
    this.elements = ortho.elements;

    return this;
  }

  multiply({ elements }) {
    const tmp = new Matrix4x4();

    for (let i = 0; i < 4; i++) {
      tmp.elements[i * 4 + 0] =
        this.elements[i * 4 + 0] * elements[0 * 4 + 0] +
        this.elements[i * 4 + 1] * elements[1 * 4 + 0] +
        this.elements[i * 4 + 2] * elements[2 * 4 + 0] +
        this.elements[i * 4 + 3] * elements[3 * 4 + 0];

      tmp.elements[i * 4 + 1] =
        this.elements[i * 4 + 0] * elements[0 * 4 + 1] +
        this.elements[i * 4 + 1] * elements[1 * 4 + 1] +
        this.elements[i * 4 + 2] * elements[2 * 4 + 1] +
        this.elements[i * 4 + 3] * elements[3 * 4 + 1];

      tmp.elements[i * 4 + 2] =
        this.elements[i * 4 + 0] * elements[0 * 4 + 2] +
        this.elements[i * 4 + 1] * elements[1 * 4 + 2] +
        this.elements[i * 4 + 2] * elements[2 * 4 + 2] +
        this.elements[i * 4 + 3] * elements[3 * 4 + 2];

      tmp.elements[i * 4 + 3] =
        this.elements[i * 4 + 0] * elements[0 * 4 + 3] +
        this.elements[i * 4 + 1] * elements[1 * 4 + 3] +
        this.elements[i * 4 + 2] * elements[2 * 4 + 3] +
        this.elements[i * 4 + 3] * elements[3 * 4 + 3];
    }

    this.elements = tmp.elements;
    return this;
  }

  copy() {
    const tmp = new Matrix4x4();
    for (let i = 0; i < 16; i++) {
      tmp.elements[i] = this.elements[i];
    }
    return tmp;
  }

  get(row, col) {
    return this.elements[4 * row + col];
  }

  // In-place inversion
  invert() {
    const tmp0 = this.get(2, 2) * this.get(3, 3);
    const tmp1 = this.get(3, 2) * this.get(2, 3);
    const tmp2 = this.get(1, 2) * this.get(3, 3);
    const tmp3 = this.get(3, 2) * this.get(1, 3);
    const tmp4 = this.get(1, 2) * this.get(2, 3);
    const tmp5 = this.get(2, 2) * this.get(1, 3);
    const tmp6 = this.get(0, 2) * this.get(3, 3);
    const tmp7 = this.get(3, 2) * this.get(0, 3);
    const tmp8 = this.get(0, 2) * this.get(2, 3);
    const tmp9 = this.get(2, 2) * this.get(0, 3);
    const tmp10 = this.get(0, 2) * this.get(1, 3);
    const tmp11 = this.get(1, 2) * this.get(0, 3);
    const tmp12 = this.get(2, 0) * this.get(3, 1);
    const tmp13 = this.get(3, 0) * this.get(2, 1);
    const tmp14 = this.get(1, 0) * this.get(3, 1);
    const tmp15 = this.get(3, 0) * this.get(1, 1);
    const tmp16 = this.get(1, 0) * this.get(2, 1);
    const tmp17 = this.get(2, 0) * this.get(1, 1);
    const tmp18 = this.get(0, 0) * this.get(3, 1);
    const tmp19 = this.get(3, 0) * this.get(0, 1);
    const tmp20 = this.get(0, 0) * this.get(2, 1);
    const tmp21 = this.get(2, 0) * this.get(0, 1);
    const tmp22 = this.get(0, 0) * this.get(1, 1);
    const tmp23 = this.get(1, 0) * this.get(0, 1);

    const t0 =
      tmp0 * this.get(1, 1) +
      tmp3 * this.get(2, 1) +
      tmp4 * this.get(3, 1) -
      (tmp1 * this.get(1, 1) +
        tmp2 * this.get(2, 1) +
        tmp5 * this.get(3, 1));
    const t1 =
      tmp1 * this.get(0, 1) +
      tmp6 * this.get(2, 1) +
      tmp9 * this.get(3, 1) -
      (tmp0 * this.get(0, 1) +
        tmp7 * this.get(2, 1) +
        tmp8 * this.get(3, 1));
    const t2 =
      tmp2 * this.get(0, 1) +
      tmp7 * this.get(1, 1) +
      tmp10 * this.get(3, 1) -
      (tmp3 * this.get(0, 1) +
        tmp6 * this.get(1, 1) +
        tmp11 * this.get(3, 1));
    const t3 =
      tmp5 * this.get(0, 1) +
      tmp8 * this.get(1, 1) +
      tmp11 * this.get(2, 1) -
      (tmp4 * this.get(0, 1) +
        tmp9 * this.get(1, 1) +
        tmp10 * this.get(2, 1));

    const d =
      1.0 /
      (this.get(0, 0) * t0 +
        this.get(1, 0) * t1 +
        this.get(2, 0) * t2 +
        this.get(3, 0) * t3);

    const out00 = d * t0;
    const out01 = d * t1;
    const out02 = d * t2;
    const out03 = d * t3;

    const out10 =
      d *
      (tmp1 * this.get(1, 0) +
        tmp2 * this.get(2, 0) +
        tmp5 * this.get(3, 0) -
        (tmp0 * this.get(1, 0) +
          tmp3 * this.get(2, 0) +
          tmp4 * this.get(3, 0)));
    const out11 =
      d *
      (tmp0 * this.get(0, 0) +
        tmp7 * this.get(2, 0) +
        tmp8 * this.get(3, 0) -
        (tmp1 * this.get(0, 0) +
          tmp6 * this.get(2, 0) +
          tmp9 * this.get(3, 0)));
    const out12 =
      d *
      (tmp3 * this.get(0, 0) +
        tmp6 * this.get(1, 0) +
        tmp11 * this.get(3, 0) -
        (tmp2 * this.get(0, 0) +
          tmp7 * this.get(1, 0) +
          tmp10 * this.get(3, 0)));
    const out13 =
      d *
      (tmp4 * this.get(0, 0) +
        tmp9 * this.get(1, 0) +
        tmp10 * this.get(2, 0) -
        (tmp5 * this.get(0, 0) +
          tmp8 * this.get(1, 0) +
          tmp11 * this.get(2, 0)));

    const out20 =
      d *
      (tmp12 * this.get(1, 3) +
        tmp15 * this.get(2, 3) +
        tmp16 * this.get(3, 3) -
        (tmp13 * this.get(1, 3) +
          tmp14 * this.get(2, 3) +
          tmp17 * this.get(3, 3)));
    const out21 =
      d *
      (tmp13 * this.get(0, 3) +
        tmp18 * this.get(2, 3) +
        tmp21 * this.get(3, 3) -
        (tmp12 * this.get(0, 3) +
          tmp19 * this.get(2, 3) +
          tmp20 * this.get(3, 3)));
    const out22 =
      d *
      (tmp14 * this.get(0, 3) +
        tmp19 * this.get(1, 3) +
        tmp22 * this.get(3, 3) -
        (tmp15 * this.get(0, 3) +
          tmp18 * this.get(1, 3) +
          tmp23 * this.get(3, 3)));
    const out23 =
      d *
      (tmp17 * this.get(0, 3) +
        tmp20 * this.get(1, 3) +
        tmp23 * this.get(2, 3) -
        (tmp16 * this.get(0, 3) +
          tmp21 * this.get(1, 3) +
          tmp22 * this.get(2, 3)));

    const out30 =
      d *
      (tmp14 * this.get(2, 2) +
        tmp17 * this.get(3, 2) +
        tmp13 * this.get(1, 2) -
        (tmp16 * this.get(3, 2) +
          tmp12 * this.get(1, 2) +
          tmp15 * this.get(2, 2)));
    const out31 =
      d *
      (tmp20 * this.get(3, 2) +
        tmp12 * this.get(0, 2) +
        tmp19 * this.get(2, 2) -
        (tmp18 * this.get(2, 2) +
          tmp21 * this.get(3, 2) +
          tmp13 * this.get(0, 2)));
    const out32 =
      d *
      (tmp18 * this.get(1, 2) +
        tmp23 * this.get(3, 2) +
        tmp15 * this.get(0, 2) -
        (tmp22 * this.get(3, 2) +
          tmp14 * this.get(0, 2) +
          tmp19 * this.get(1, 2)));
    const out33 =
      d *
      (tmp22 * this.get(2, 2) +
        tmp16 * this.get(0, 2) +
        tmp21 * this.get(1, 2) -
        (tmp20 * this.get(1, 2) +
          tmp23 * this.get(2, 2) +
          tmp17 * this.get(0, 2)));

    this.elements[0 * 4 + 0] = out00;
    this.elements[0 * 4 + 1] = out01;
    this.elements[0 * 4 + 2] = out02;
    this.elements[0 * 4 + 3] = out03;
    this.elements[1 * 4 + 0] = out10;
    this.elements[1 * 4 + 1] = out11;
    this.elements[1 * 4 + 2] = out12;
    this.elements[1 * 4 + 3] = out13;
    this.elements[2 * 4 + 0] = out20;
    this.elements[2 * 4 + 1] = out21;
    this.elements[2 * 4 + 2] = out22;
    this.elements[2 * 4 + 3] = out23;
    this.elements[3 * 4 + 0] = out30;
    this.elements[3 * 4 + 1] = out31;
    this.elements[3 * 4 + 2] = out32;
    this.elements[3 * 4 + 3] = out33;
    return this;
  }

  // Returns new matrix which is the inverse of this
  inverse() {
    const tmp = this.copy();
    return tmp.invert();
  }

  // In-place transpose
  transpose() {
    let tmp = this.elements[0 * 4 + 1];
    this.elements[0 * 4 + 1] = this.elements[1 * 4 + 0];
    this.elements[1 * 4 + 0] = tmp;

    tmp = this.elements[0 * 4 + 2];
    this.elements[0 * 4 + 2] = this.elements[2 * 4 + 0];
    this.elements[2 * 4 + 0] = tmp;

    tmp = this.elements[0 * 4 + 3];
    this.elements[0 * 4 + 3] = this.elements[3 * 4 + 0];
    this.elements[3 * 4 + 0] = tmp;

    tmp = this.elements[1 * 4 + 2];
    this.elements[1 * 4 + 2] = this.elements[2 * 4 + 1];
    this.elements[2 * 4 + 1] = tmp;

    tmp = this.elements[1 * 4 + 3];
    this.elements[1 * 4 + 3] = this.elements[3 * 4 + 1];
    this.elements[3 * 4 + 1] = tmp;

    tmp = this.elements[2 * 4 + 3];
    this.elements[2 * 4 + 3] = this.elements[3 * 4 + 2];
    this.elements[3 * 4 + 2] = tmp;

    return this;
  }

  loadIdentity() {
    for (let i = 0; i < 16; i++) {
      this.elements[i] = 0;
    }
    this.elements[0 * 4 + 0] = 1.0;
    this.elements[1 * 4 + 1] = 1.0;
    this.elements[2 * 4 + 2] = 1.0;
    this.elements[3 * 4 + 3] = 1.0;
    return this;
  }
}
