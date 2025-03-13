"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Camera } from "lucide-react";

type ImageFormat = "png" | "jpeg" | "gif";

interface TimingInfo {
  captureTime: string;
  processingTime?: string;
  uploadTime: string;
  totalTime: string;
}

interface ScreenshotResponse {
  screenshotUrl: string;
  hostedUrl: string;
  timing: TimingInfo;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [divId, setDivId] = useState("");
  const [imageFormat, setImageFormat] = useState<ImageFormat>("png");
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [timing, setTiming] = useState<TimingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function captureScreenshot() {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          divId,
          imageFormat,
          navigationTimeout: 90000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to capture screenshot");
      }

      const data: ScreenshotResponse = await response.json();
      setScreenshotUrl(data.screenshotUrl);
      setHostedUrl(data.hostedUrl);
      setTiming(data.timing);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to capture screenshot"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">snapi</h1>
          </div>
          <p className="text-muted-foreground text-center max-w-[500px]">
            Capture, convert, and share website screenshots instantly. Support
            for static images and animated GIFs.
          </p>
        </div>

        <Card className="w-full max-w-3xl mx-auto border-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium">
                    Website URL
                  </label>
                  <Input
                    id="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="border-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="divId" className="text-sm font-medium">
                    Element ID (Optional)
                  </label>
                  <Input
                    id="divId"
                    placeholder="main-content"
                    value={divId}
                    onChange={(e) => setDivId(e.target.value)}
                    className="border-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Capture a specific element by its ID
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="imageFormat" className="text-sm font-medium">
                    Image Format
                  </label>
                  <Select
                    value={imageFormat}
                    onValueChange={(value) =>
                      setImageFormat(value as ImageFormat)
                    }
                  >
                    <SelectTrigger className="border-muted/50">
                      <SelectValue placeholder="Select image format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="gif">GIF</SelectItem>
                    </SelectContent>
                  </Select>
                  {imageFormat === "gif" && (
                    <p className="text-xs text-muted-foreground">
                      GIF capture will record multiple frames with smooth
                      animation
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  disabled={isLoading}
                  onClick={captureScreenshot}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      <span>Capturing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Capture Screenshot</span>
                    </div>
                  )}
                </Button>

                {error && (
                  <p className="text-sm text-destructive mt-2 text-center">
                    {error}
                  </p>
                )}
              </div>

              {screenshotUrl && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium">Preview</h3>
                  {timing && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Time</p>
                        <p className="font-medium">{timing.totalTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capture Time</p>
                        <p className="font-medium">{timing.captureTime}</p>
                      </div>
                      {timing.processingTime && (
                        <div>
                          <p className="text-muted-foreground">
                            Processing Time
                          </p>
                          <p className="font-medium">{timing.processingTime}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Upload Time</p>
                        <p className="font-medium">{timing.uploadTime}</p>
                      </div>
                    </div>
                  )}
                  <div className="relative border border-muted/50 rounded-lg overflow-hidden bg-muted/10">
                    <Image
                      src={screenshotUrl}
                      alt="Captured screenshot"
                      width={800}
                      height={600}
                      className="w-full"
                      style={{ aspectRatio: "4/3", objectFit: "contain" }}
                      unoptimized={imageFormat === "gif"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        hostedUrl && window.open(hostedUrl, "_blank")
                      }
                      className="w-full border-muted/50"
                    >
                      Open Hosted Image
                    </Button>
                    <p className="text-sm text-muted-foreground break-all">
                      Hosted URL: {hostedUrl}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Snapi • Fast and reliable website screenshots</p>
        </footer>
      </div>
    </main>
  );
}
