declare module "gif-encoder-2" {
  class GIFEncoder {
    constructor(
      width: number,
      height: number,
      algorithm?: string,
      useOptimizer?: boolean
    );
    setDelay(ms: number): void;
    setQuality(quality: number): void;
    setRepeat(repeat: number): void;
    start(): void;
    addFrame(imageData: Uint8Array | Uint8ClampedArray): void;
    finish(): void;
    out: {
      getData(): Buffer;
    };
  }
  export = GIFEncoder;
}
