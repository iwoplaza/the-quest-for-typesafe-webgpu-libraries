import tgpu from "typegpu";
import "./style.css";
import { filter, join, map, pipe } from 'remeda';

const stats = document.getElementById('stats') as HTMLDivElement;
const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;

const versionRunners = {
  "1": await import("./1-through-cpu.ts").then((m) => m.default),
  "2": await import("./2-gpu.ts").then((m) => m.default),
  "3": await import("./3-tgsl.ts").then((m) => m.default),
  "4": await import("./3-tgsl.ts").then((m) => m.default), // TODO: Implement version 4
};

const versionButtons = {
  "1": document.getElementById("btn-version-1") as HTMLButtonElement,
  "2": document.getElementById("btn-version-2") as HTMLButtonElement,
  "3": document.getElementById("btn-version-3") as HTMLButtonElement,
  "4": document.getElementById("btn-version-4") as HTMLButtonElement,
} as const;

const root = await tgpu.init();

let size = Number.parseInt(localStorage.getItem("size") ?? "8");
sizeSlider.value = `${size}`;
let currentVersion = Number.parseInt(localStorage.getItem("version") ?? "1") as
  | 1
  | 2
  | 3
  | 4;

let cleanup: (() => void) | undefined;
async function runVersion(v: 1 | 2 | 3 | 4): Promise<void> {
  cleanup?.();
  stats.innerHTML = '';
  currentVersion = v;
  localStorage.setItem('version', `${v}`);

  const start = performance.now();
  performance.mark(`version start`);
  cleanup = await versionRunners[v]({ root, size });
  performance.mark(`version end`);

  performance.measure(`🫐 total time`, {
    start: `version start`,
    end: `version end`,
  });

  stats.innerHTML = pipe(
    performance.getEntries(),
    filter((e) =>
      e.name.startsWith("🫐") && e.startTime >= start
    ),
    map((entry) => `<li><span style="display: inline-block; min-width: 7em">${entry.name}:</span> ${entry.duration.toFixed(3)} ms</li>`),
    join(''),
  );

  Object.values(versionButtons).forEach((btn) =>
    btn.classList.remove("active")
  );
  versionButtons[v].classList.add("active");
}

Object.entries(versionButtons).forEach(([v, btn]) => {
  btn.addEventListener("click", () => {
    runVersion(Number.parseInt(v) as 1 | 2 | 3 | 4);
  });
});

sizeSlider.addEventListener('input', () => {
  size = Number.parseInt(sizeSlider.value);
  localStorage.setItem('size', `${size}`);
  runVersion(currentVersion);
});

await runVersion(currentVersion);
