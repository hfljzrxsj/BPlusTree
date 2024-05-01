import cb from "./cb";

const {
  Promise,
  addEventListener,
  console
} = window ?? self ?? globalThis ?? global ?? parent ?? this;
export const waitOnLoadEventLoop = (callback: () => void = () => { }) => addEventListener('load', () => new Promise<void>(resolve =>
  cb?.(resolve)
)?.then?.(() =>
  cb?.(callback)
).catch?.(console?.error));