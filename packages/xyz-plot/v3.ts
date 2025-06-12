import tgpu, { isBuffer, StorageFlag, TgpuBuffer, TgpuRoot } from "typegpu";
import * as d from "typegpu/data";
import * as std from "typegpu/std";
import { mat4 } from "wgpu-matrix";

export interface Options {
  target: HTMLCanvasElement;
  pointSize?: number;
}

const PointsArray = (n: number) => d.arrayOf(d.vec3f, n);

const staticPointSizeAccess = tgpu["~unstable"].accessor(d.f32);

const getPointSizeSlot = tgpu["~unstable"].slot(
  tgpu["~unstable"].fn([d.vec3f], d.f32)(() => staticPointSizeAccess.value),
);

const layout = tgpu.bindGroupLayout({
  viewProj: { uniform: d.mat4x4f },
  points: { storage: PointsArray, access: "readonly" },
});

const mainVertex = tgpu["~unstable"].vertexFn({
  in: { vid: d.builtin.vertexIndex, iid: d.builtin.instanceIndex },
  out: { pos: d.builtin.position, uv: d.vec2f },
})((input) => {
  const point = layout.$.points[input.iid]!;

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

  const pointSize = getPointSizeSlot.value(point);
  const billboardPos = d.vec3f(std.mul(pointSize, pos[input.vid]!), 0.0);
  const globalPos = std.add(point, billboardPos);

  return {
    pos: std.mul(layout.$.viewProj, d.vec4f(globalPos, 1.0)),
    uv: uv[input.vid]!,
  };
});

const mainFragment = tgpu["~unstable"].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const distToCenter = std.distance(input.uv, d.vec2f(0.5, 0.5)) * 2;
  if (distToCenter > 1) {
    std.discard();
  }
  return d.vec4f(0, 0, 0, 1);
});

export async function initXyz(root: TgpuRoot, options: Options) {
  const { target, pointSize = 0.001 } = options;

  const context = target.getContext("webgpu") as GPUCanvasContext;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device: root.device,
    format: presentationFormat,
    alphaMode: "premultiplied",
  });

  const pipeline = root["~unstable"]
    .with(staticPointSizeAccess, pointSize)
    .withVertex(mainVertex, {})
    .withFragment(mainFragment, { format: presentationFormat })
    .withPrimitive({ topology: "triangle-strip" })
    .withDepthStencil({
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    })
    .createPipeline();

  const depthTexture = root.device.createTexture({
    size: [target.width, target.height, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const depthView = depthTexture.createView();

  async function plot3d(
    points:
      | readonly (readonly [number, number, number])[]
      | TgpuBuffer<d.WgslArray<d.Vec3f>> & StorageFlag
      | GPUBuffer,
  ): Promise<void> {
    const viewMat = mat4.lookAt(
      d.vec3f(0, 0.5, 1.5),
      d.vec3f(0),
      d.vec3f(0, 1, 0),
      d.mat4x4f(),
    );
    const projMat = mat4.perspective(
      60 / 180 * Math.PI,
      1,
      0.001,
      1000,
      d.mat4x4f(),
    );

    const viewProjBuffer = root.createBuffer(
      d.mat4x4f,
      mat4.mul(projMat, viewMat, d.mat4x4f()),
    ).$usage("uniform");

    const uploadStart = performance.now();

    let ownBuffer = !isBuffer(points);
    const pointsBuffer: TgpuBuffer<d.WgslArray<d.Vec3f>> & StorageFlag =
      (() => {
        if (isBuffer(points)) {
          return points;
        }

        if (!Array.isArray(points)) {
          const buffer = points as GPUBuffer;
          return root
            .createBuffer(PointsArray(buffer.size / 16), buffer)
            .$usage("storage");
        }

        const initial = points.flatMap(([x, y, z]) => [x, y, z, 0]);

        const flatBuffer = root
          .createBuffer(d.arrayOf(d.f32, points.length * 4), initial)
          .$usage("storage");

        return root
          .createBuffer(PointsArray(points.length), root.unwrap(flatBuffer))
          .$usage("storage");
      })();

    const pointCount = isBuffer(points)
      ? points.dataType.elementCount
      : !Array.isArray(points)
      ? (points as GPUBuffer).size / 16
      : points.length;

    const group = root.createBindGroup(layout, {
      viewProj: viewProjBuffer,
      points: pointsBuffer,
    });

    pipeline
      .with(layout, group)
      .withColorAttachment({
        view: context.getCurrentTexture().createView(),
        clearValue: [0.9, 0.9, 0.9, 1],
        loadOp: "clear",
        storeOp: "store",
      })
      .withDepthStencilAttachment({
        view: depthView,
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      })
      .draw(4, pointCount);

    await root.device.queue.onSubmittedWorkDone();

    performance.measure('🫐 upload', { start: uploadStart });

    if (ownBuffer) {
      // We created the buffer, so we destroy it.
      pointsBuffer.destroy();
    }

    viewProjBuffer.destroy();

  }

  return {
    plot3d,
    destroy() {
      depthTexture.destroy();
    },
  };
}
