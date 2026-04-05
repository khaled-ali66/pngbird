export const processImages = async (
  whiteUrl: string, 
  blackUrl: string, 
  canvas: HTMLCanvasElement | OffscreenCanvas
): Promise<string> => {
  const loadImg = async (src: string): Promise<ImageBitmap | HTMLImageElement> => {
    const res = await fetch(src);
    const blob = await res.blob();
    if ('createImageBitmap' in window) {
      return await createImageBitmap(blob);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const [imgW, imgB] = await Promise.all([loadImg(whiteUrl), loadImg(blackUrl)]);
  
  canvas.width = imgW.width;
  canvas.height = imgW.height;

  // Try WebGL for GPU acceleration
  try {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl', { premultipliedAlpha: false }) || 
               (canvas as HTMLCanvasElement).getContext('experimental-webgl', { premultipliedAlpha: false });
               
    if (gl) {
      return await processImagesWebGL(gl as WebGLRenderingContext, imgW, imgB, canvas);
    }
  } catch (e) {
    console.warn("WebGL failed, falling back to CPU", e);
  }

  // Fallback to CPU
  return processImagesCPU(imgW, imgB, canvas);
};

const processImagesWebGL = async (
  gl: WebGLRenderingContext,
  imgW: ImageBitmap | HTMLImageElement,
  imgB: ImageBitmap | HTMLImageElement,
  canvas: HTMLCanvasElement | OffscreenCanvas
): Promise<string> => {
  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      // Map [-1, 1] to [0, 1] for texture coordinates.
      // We flip Y here because WebGL's coordinate system is bottom-up,
      // but images and canvas are top-down.
      v_texcoord = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
    }
  `;

  const fsSource = `
    precision highp float;
    varying vec2 v_texcoord;
    uniform sampler2D u_white;
    uniform sampler2D u_black;

    void main() {
      vec4 colorW = texture2D(u_white, v_texcoord);
      vec4 colorB = texture2D(u_black, v_texcoord);
      
      float dR = max(colorW.r - colorB.r, 0.0);
      float dG = max(colorW.g - colorB.g, 0.0);
      float dB = max(colorW.b - colorB.b, 0.0);
      
      float diff = max(dR, max(dG, dB));
      float alpha = 1.0 - diff;
      
      if (alpha < 8.0 / 255.0) {
        gl_FragColor = vec4(0.0);
        return;
      }
      
      if (alpha < 40.0 / 255.0) {
        alpha = alpha * alpha * 7.96875;
      }
      
      if (alpha > 240.0 / 255.0) {
        alpha = 1.0;
      }
      
      alpha = clamp(alpha, 0.0, 1.0);
      
      float invAlpha = 1.0 / alpha;
      float outR = clamp(colorB.r * invAlpha, 0.0, 1.0);
      float outG = clamp(colorB.g * invAlpha, 0.0, 1.0);
      float outB = clamp(colorB.b * invAlpha, 0.0, 1.0);
      
      gl_FragColor = vec4(outR, outG, outB, alpha);
    }
  `;

  const createShader = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile error');
    }
    return shader;
  };

  const program = gl.createProgram()!;
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program link error');
  }

  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,   1.0, -1.0,  -1.0,  1.0,
    -1.0,  1.0,   1.0, -1.0,   1.0,  1.0
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Disable FLIP_Y to ensure consistent behavior across ImageBitmap and HTMLImageElement
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  const createTexture = (img: any, unit: number) => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return tex;
  };

  createTexture(imgW, 0);
  createTexture(imgB, 1);

  gl.uniform1i(gl.getUniformLocation(program, "u_white"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "u_black"), 1);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  if ('toBlob' in canvas) {
    return new Promise((resolve) => {
      (canvas as unknown as HTMLCanvasElement).toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } else {
          resolve((canvas as unknown as HTMLCanvasElement).toDataURL('image/png'));
        }
      }, 'image/png');
    });
  }
  
  return (canvas as unknown as HTMLCanvasElement).toDataURL('image/png');
};

const processImagesCPU = (
  imgW: ImageBitmap | HTMLImageElement,
  imgB: ImageBitmap | HTMLImageElement,
  canvas: HTMLCanvasElement | OffscreenCanvas
): string | Promise<string> => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) throw new Error("Could not get canvas context");
  
  ctx.drawImage(imgW, 0, 0);
  const whiteData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  ctx.drawImage(imgB, 0, 0);
  const blackData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const outputData = ctx.createImageData(canvas.width, canvas.height);
  
  const whiteBuffer = new Uint32Array(whiteData.data.buffer);
  const blackBuffer = new Uint32Array(blackData.data.buffer);
  const outBuffer = new Uint32Array(outputData.data.buffer);
  
  const len = whiteBuffer.length;
  for (let i = 0; i < len; i++) {
    const pixW = whiteBuffer[i];
    const pixB = blackBuffer[i];
    
    const rW = pixW & 0xFF;
    const gW = (pixW >> 8) & 0xFF;
    const bW = (pixW >> 16) & 0xFF;

    const rB = pixB & 0xFF;
    const gB = (pixB >> 8) & 0xFF;
    const bB = (pixB >> 16) & 0xFF;

    const dR = rW > rB ? rW - rB : 0;
    const dG = gW > gB ? gW - gB : 0;
    const dB = bW > bB ? bW - bB : 0;
    
    let diff = dR;
    if (dG > diff) diff = dG;
    if (dB > diff) diff = dB;

    let alpha = 255 - diff;
    
    if (alpha < 8) {
      outBuffer[i] = 0;
      continue;
    } 
    
    if (alpha < 40) {
      alpha = (alpha * alpha) >> 5;
    }

    // Clamp near-opaque pixels to fully opaque to fix AI inconsistencies
    if (alpha > 240) {
      alpha = 255;
    }

    if (alpha > 255) alpha = 255;
    
    const invAlpha = 255 / alpha;
    let outR = (rB * invAlpha) | 0;
    let outG = (gB * invAlpha) | 0;
    let outB = (bB * invAlpha) | 0;
    
    if (outR > 255) outR = 255;
    if (outG > 255) outG = 255;
    if (outB > 255) outB = 255;
    
    outBuffer[i] = (alpha << 24) | (outB << 16) | (outG << 8) | outR;
  }
  
  ctx.putImageData(outputData, 0, 0);
  
  if ('toBlob' in canvas) {
    return new Promise((resolve) => {
      (canvas as unknown as HTMLCanvasElement).toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } else {
          resolve((canvas as unknown as HTMLCanvasElement).toDataURL('image/png'));
        }
      }, 'image/png');
    });
  }
  
  return (canvas as unknown as HTMLCanvasElement).toDataURL('image/png');
};

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1, initialDelay = 200): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries + 1; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isRetryable = err.message?.includes('500') ||
                         err.message?.includes('503') || 
                         err.message?.includes('429') || 
                         err.message?.includes('UNAVAILABLE') ||
                         err.message?.includes('RESOURCE_EXHAUSTED') ||
                         err.message?.includes('fetch');
      
      if (!isRetryable || i === maxRetries) throw err;
      
      const delay = initialDelay * (i + 1); 
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
