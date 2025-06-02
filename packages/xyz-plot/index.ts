import tgpu from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import { mat4 } from "wgpu-matrix";

interface Options {
  target: HTMLCanvasElement;
}

const PointsArray = (n: number) => d.arrayOf(d.vec3f, n);

const layout = tgpu.bindGroupLayout({
  viewProj: { uniform: d.mat4x4f },
  points: { storage: PointsArray, access: "readonly" },
});

const mainVertex = tgpu["~unstable"].vertexFn({
  in: { vid: d.builtin.vertexIndex, iid: d.builtin.instanceIndex },
  out: { pos: d.builtin.position, uv: d.vec2f },
})((input) => {
  const globalPos = layout.$.points[input.iid]!;

  const pos = [
    d.vec2f(-1, 1),
    d.vec2f(-1, -1),
    d.vec2f(1, 1),
    d.vec2f(1, -1),
  ];

  const uv = [
    d.vec2f(0, 0),
    d.vec2f(0, 1),
    d.vec2f(1, 0),
    d.vec2f(1, 1),
  ];

  return {
    pos: std.mul(layout.$.viewProj, d.vec4f(pos[input.vid]!, -10.0, 1.0)),
    uv: uv[input.vid]!,
  };
});

const mainFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  return d.vec4f(input.uv.x, input.uv.y, 0, 1);
});

export async function initXyzPlot(options: Options) {
  const root = await tgpu.init();
  const context = options.target.getContext("webgpu") as GPUCanvasContext;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device: root.device,
    format: presentationFormat,
    alphaMode: "premultiplied",
  });

  const pipeline = root["~unstable"]
    .withVertex(mainVertex, {})
    .withFragment(mainFragment, { format: presentationFormat })
    .withPrimitive({ topology: 'triangle-strip' })
    .createPipeline();

  async function plot3d(points: [number, number, number][]): Promise<void> {
    const viewProjBuffer = root.createBuffer(
      d.mat4x4f,
      mat4.perspective(60 / 180 * Math.PI, 1, -1, 1, d.mat4x4f()),
    ).$usage("uniform");

    const pointsBuffer = root
      .createBuffer(
        PointsArray(points.length),
        points.map(([x, y, z]) => d.vec3f(x, y, z)),
      )
      .$usage("storage");

    const group = root.createBindGroup(layout, {
      viewProj: viewProjBuffer,
      points: pointsBuffer,
    });

    pipeline
      .with(layout, group)
      .withColorAttachment({
        view: context.getCurrentTexture().createView(),
        clearValue: [1, 0, 0, 1],
        loadOp: "clear",
        storeOp: "store",
      }).draw(4);

    pointsBuffer.destroy();
  }

  return {
    plot3d,
    destroy() {
      root.destroy();
    },
  };
}
