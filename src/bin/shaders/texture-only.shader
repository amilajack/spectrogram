float4x4 worldViewProjection : WORLDVIEWPROJECTION;

// The texture sampler is used to access the texture bitmap in the fragment
// shader.
sampler texSampler0;

// input parameters for our vertex shader
struct PixelShaderInput {
  float4 position : POSITION;
  float2 texcoord : TEXCOORD0;  // Texture coordinates
};

// input parameters for our pixel shader
struct VertexShaderInput {
  float4 position : POSITION;
  float2 texcoord : TEXCOORD0;  // Texture coordinates
};

/**
 * Our vertex shader
 */
PixelShaderInput vertexShaderFunction(VertexShaderInput input) {
  PixelShaderInput output;
  output.position = mul(input.position, worldViewProjection);
  output.texcoord = input.texcoord;
  return output;
}

/* Given the texture coordinates, our pixel shader grabs the corresponding
 * color from the texture.
 */
float4 pixelShaderFunction(PixelShaderInput input): COLOR {
  return tex2D(texSampler0, input.texcoord);
}

// Here we tell our effect file *which* functions are
// our vertex and pixel shaders.
// #o3d VertexShaderEntryPoint vertexShaderFunction
// #o3d PixelShaderEntryPoint pixelShaderFunction
// #o3d MatrixLoadOrder RowMajor
