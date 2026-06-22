"use client"

import { useEffect, useRef } from "react"

// Liquid neon WebGL background from the Stitch "Zero-UI" design. Vanilla WebGL,
// no external dependencies. Renders behind the home content and degrades to a
// transparent canvas where WebGL is unavailable.
const VERTEX_SRC = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAGMENT_SRC = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 m = u_mouse / u_resolution;

    float n1 = snoise(uv * 2.0 + u_time * 0.1);
    float n2 = snoise(uv * 4.0 - u_time * 0.15 + n1);
    float n3 = snoise(uv * 8.0 + u_time * 0.2 + n2);

    float intensity = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    intensity = smoothstep(-1.0, 1.0, intensity);

    float d = distance(uv, m);
    float mouseEffect = smoothstep(0.4, 0.0, d) * 0.5;
    intensity += mouseEffect;

    vec3 colorA = vec3(0.04, 0.07, 0.15);
    vec3 colorB = vec3(0.66, 0.33, 0.97);
    vec3 colorC = vec3(0.2, 0.6, 0.9);

    vec3 finalColor = mix(colorA, colorB, intensity * 0.6);
    finalColor = mix(finalColor, colorC, pow(intensity, 3.0) * 0.4);

    float vignette = smoothstep(1.5, 0.5, length(uv - 0.5) * 2.0);
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
}`

export default function ShaderBackground({
  className = "",
}: {
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      return shader
    }

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SRC))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )
    const pos = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, "u_time")
    const uRes = gl.getUniformLocation(program, "u_resolution")
    const uMouse = gl.getUniformLocation(program, "u_mouse")

    const syncSize = () => {
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    syncSize()

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncSize)
        : null
    ro?.observe(canvas)

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener("mousemove", onMove)

    let raf = 0
    const render = (t: number) => {
      if (!ro) syncSize()
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      ro?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  )
}
