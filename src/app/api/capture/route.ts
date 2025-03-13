import { NextResponse } from "next/server";
import { chromium, type PageScreenshotOptions, type Page } from "playwright";
import GIFEncoder from "gif-encoder-2";
import { createCanvas, Image } from "canvas";
import { uploadToImgBB } from "@/lib/upload-image";

interface GifOptions {
  frameCount: number;
  frameDelay: number;
  quality: number;
  captureInterval: number;
}

interface RequestBody {
  url: string;
  divId?: string;
  imageFormat: "png" | "jpeg" | "gif";
  captureDelay?: number;
  navigationTimeout?: number;
  maxRetries?: number;
  gifOptions?: Partial<GifOptions>;
}

interface TimingInfo {
  captureTime: number;
  processingTime?: number;
  uploadTime?: number;
  totalTime: number;
}

interface PlaywrightError extends Error {
  name: string;
}

async function createGif(frames: Buffer[], quality = 25): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const firstImage = new Image();
      firstImage.onload = async () => {
        let width = firstImage.width;
        let height = firstImage.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        const encoder = new GIFEncoder(width, height, "neuquant", true);

        encoder.setDelay(200);
        encoder.setQuality(quality);
        encoder.setRepeat(0);
        encoder.start();

        for (const frameBuffer of frames) {
          await new Promise<void>((resolveFrame) => {
            const image = new Image();
            image.onload = () => {
              ctx.clearRect(0, 0, width, height);
              ctx.drawImage(image, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              encoder.addFrame(imageData.data);
              resolveFrame();
            };
            image.src = frameBuffer;
          });
        }

        encoder.finish();
        resolve(encoder.out.getData());
      };

      firstImage.src = frames[0];
    } catch (error) {
      reject(error);
    }
  });
}

async function navigateWithRetry({
  page,
  url,
  maxRetries = 3,
  navigationTimeout = 60000,
}: {
  page: Page;
  url: string;
  maxRetries?: number;
  navigationTimeout?: number;
}) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: navigationTimeout,
      });
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Navigation attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw new Error(
    `Failed to load page after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    const body: RequestBody = await request.json();

    const defaultGifOptions: GifOptions = {
      frameCount: 4,
      frameDelay: 200,
      quality: 10,
      captureInterval: 100,
    };

    const {
      url,
      divId,
      imageFormat = "png",
      captureDelay = 1000,
      navigationTimeout = 60000,
      maxRetries = 3,
      gifOptions: userGifOptions = {},
    } = body;

    const gifOptions: GifOptions = {
      ...defaultGifOptions,
      ...userGifOptions,
    };

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    try {
      await navigateWithRetry({
        page,
        url,
        maxRetries,
        navigationTimeout,
      });

      await page.waitForTimeout(captureDelay);

      let screenshotBuffer: Buffer;
      const timing: TimingInfo = {
        captureTime: 0,
        processingTime: 0,
        uploadTime: 0,
        totalTime: 0,
      };

      if (imageFormat === "gif") {
        const captureStartTime = Date.now();
        const frames: Buffer[] = [];

        let element;
        if (divId) {
          await page.waitForSelector(`#${divId}`, { timeout: 5000 });
          element = await page.$(`#${divId}, [id="${divId}"]`);
          if (!element) {
            throw new Error(
              `Element with ID "${divId}" not found after waiting`
            );
          }
          await element.waitForElementState("visible");
          await element.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200); // Reduced from 500ms
        }

        for (let i = 0; i < gifOptions.frameCount; i++) {
          const frame = (await (divId && element
            ? element.screenshot({ type: "png" })
            : page.screenshot({
                type: "png",
                fullPage: true,
                scale: "device",
              }))) as Buffer;
          frames.push(frame);
          if (i < gifOptions.frameCount - 1) {
            await page.waitForTimeout(gifOptions.captureInterval);
          }
        }
        timing.captureTime = Date.now() - captureStartTime;

        const processingStartTime = Date.now();
        screenshotBuffer = await createGif(frames, gifOptions.quality);
        timing.processingTime = Date.now() - processingStartTime;
      } else {
        const captureStartTime = Date.now();
        const options: PageScreenshotOptions = {
          type: imageFormat,
          fullPage: !divId,
        };

        if (divId) {
          try {
            await page.waitForSelector(`#${divId}`, { timeout: 5000 });
            const element = await page.$(`#${divId}, [id="${divId}"]`);
            if (!element) {
              throw new Error(
                `Element with ID "${divId}" not found after waiting`
              );
            }
            await element.waitForElementState("visible");
            await element.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            screenshotBuffer = (await element.screenshot(options)) as Buffer;
          } catch (error: unknown) {
            if (
              error &&
              typeof error === "object" &&
              "name" in error &&
              error.name === "TimeoutError"
            ) {
              throw new Error(
                `Timeout waiting for element with ID "${divId}" to appear`
              );
            }
            throw error;
          }
        } else {
          screenshotBuffer = (await page.screenshot(options)) as Buffer;
        }
        timing.captureTime = Date.now() - captureStartTime;
      }

      await browser.close();

      // Convert the buffer to base64 and upload to ImgBB
      const base64Image = `data:image/${imageFormat};base64,${screenshotBuffer.toString(
        "base64"
      )}`;

      const uploadStartTime = Date.now();
      const hostedUrl = await uploadToImgBB(base64Image);
      timing.uploadTime = Date.now() - uploadStartTime;

      timing.totalTime = Date.now() - startTime;

      return NextResponse.json({
        screenshotUrl: base64Image,
        hostedUrl,
        timing: {
          ...timing,
          captureTime: `${timing.captureTime}ms`,
          processingTime: timing.processingTime
            ? `${timing.processingTime}ms`
            : undefined,
          uploadTime: `${timing.uploadTime}ms`,
          totalTime: `${timing.totalTime}ms`,
        },
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error("Screenshot capture error:", error);
    return NextResponse.json(
      { error: "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
