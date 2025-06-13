/// <reference types="@webgpu/types" />

import { generateHeightMap } from "abc-gen/v2";
import { initXyz } from "xyz-plot";
import { getCanvas, type VersionOptions } from "./helpers.ts";

export default async function main({ root, size }: VersionOptions) {
  const SIZE = 2 ** size;
  const device = root.device;
  const xyz = await initXyz(root, { target: getCanvas(), pointSize: 16 / size**4 });

  const terrain = await generateHeightMap(device, [SIZE, SIZE]);

  const module = device.createShaderModule({
    code: `
      struct item_14 {
        @builtin(global_invocation_id) id: vec3u,
      }

      @group(0) @binding(0) var<storage, read> terrain_input: array<array<f32, ${SIZE}>, ${SIZE}>;
      @group(0) @binding(1) var<storage, read_write> result: array<vec3f, ${
        SIZE ** 2
      }>;

      @compute @workgroup_size(1, 1) fn item_13(_arg_0: item_14){
        var point = vec3f(f32(_arg_0.id.x), terrain_input[_arg_0.id.x][_arg_0.id.y], f32(_arg_0.id.y));
        var idx = ((_arg_0.id.y * ${SIZE}) + _arg_0.id.x);
        var norm = vec3f(((point.x * ${1 / (SIZE - 1)}) - 0.5), point.y, ((point.z * ${1 / (SIZE - 1)}) - 0.5));
        result[idx] = vec3f(norm.x * 25, norm.y * 0.01, norm.z * 25);
      }
    `,
  });

  const pointsBuffer = device.createBuffer({
    label: "points",
    size: SIZE * SIZE * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const layout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
    ],
  });

  const pipeline = device.createComputePipeline({
    label: "compute pipeline",
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    compute: { module },
  });

  const group = device.createBindGroup({
    layout,
    entries: [
      {
        binding: 0,
        resource: { buffer: terrain },
      },
      {
        binding: 1,
        resource: { buffer: pointsBuffer },
      },
    ],
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setBindGroup(0, group);
  pass.setPipeline(pipeline);
  pass.dispatchWorkgroups(SIZE, SIZE);
  pass.end();
  device.queue.submit([encoder.finish()]);

  await xyz.plot3d(pointsBuffer);

  // Cleanup function
  return () => {
    xyz.destroy();
  };
}
