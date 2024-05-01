import cb from "./cb";

const {
  Promise,
  console
} = window ?? self ?? globalThis ?? global ?? parent ?? this;
export const waitMiddleEventLoop = (callback: () => void = () => { }) => {
  return new Promise<void>(resolve => new Promise<void>(resolve =>
    cb?.(resolve)
  )?.then?.(() =>
    cb?.(() => {
      callback?.();
      resolve?.();
    })
  ).catch?.(console?.error));
};