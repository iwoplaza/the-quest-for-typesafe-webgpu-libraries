/// <reference types="@webgpu/types" />

import { generateHeightMap } from "abc-gen/v2";
import { initXyz } from "xyz-plot/v2";
import { getCanvas } from "./helpers.ts";

export default async function main() {
  const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
  const device = await adapter.requestDevice() as GPUDevice;

  const SIZE = 2048;
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
        var norm = vec3f(((point.x * 0.0004885197850512946) - 0.5), (point.y * 0.0004885197850512946), ((point.z * 0.0004885197850512946) - 0.5));
        result[idx] = (norm * 25);
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

  const xyz = await initXyz(device, { target: getCanvas(), pointSize: 0.001 });
  await xyz.plot3d(pointsBuffer);

  // Cleanup function
  return () => {
    device.destroy();
  };
}
