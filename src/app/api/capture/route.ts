import { NextResponse } from "next/server";
import { chromium, type PageScreenshotOptions } from "playwright";
import GIFEncoder from "gif-encoder-2";
import { createCanvas, Image } from "canvas";
import { uploadToImgBB } from "@/lib/upload-image";

interface RequestBody {
  url: string;
  divId?: string;
  imageFormat: "png" | "jpeg" | "gif";
  captureDelay?: number;
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

async function createGif(frames: Buffer[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const firstImage = new Image();
      firstImage.onload = async () => {
        const width = firstImage.width;
        const height = firstImage.height;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        const encoder = new GIFEncoder(width, height);

        encoder.setDelay(200);
        encoder.setQuality(50);
        encoder.setRepeat(0);
        encoder.start();

        await Promise.all(
          frames.map(async (frameBuffer) => {
            return new Promise<void>((resolveFrame) => {
              const image = new Image();
              image.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, width, height);
                encoder.addFrame(imageData.data);
                resolveFrame();
              };
              image.src = frameBuffer;
            });
          })
        );

        encoder.finish();
        resolve(encoder.out.getData());
      };

      firstImage.src = frames[0];
    } catch (error) {
      reject(error);
    }
  });
}

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    const body: RequestBody = await request.json();
    const { url, divId, imageFormat = "png", captureDelay = 1000 } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(captureDelay); // Wait for dynamic content

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
          await page.waitForTimeout(500);
        }

        for (let i = 0; i < 6; i++) {
          const frame = (await (divId && element
            ? element.screenshot({ type: "png" })
            : page.screenshot({ type: "png", fullPage: true }))) as Buffer;
          frames.push(frame);
          await page.waitForTimeout(200);
        }
        timing.captureTime = Date.now() - captureStartTime;

        const processingStartTime = Date.now();
        screenshotBuffer = await createGif(frames);
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
