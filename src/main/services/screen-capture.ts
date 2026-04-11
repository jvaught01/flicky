import { desktopCapturer, screen } from 'electron';
import type { ScreenCapture } from '../../shared/types';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 80;

/**
 * Capture all displays, returning JPEG screenshots with metadata.
 * Equivalent to CompanionScreenCaptureUtility.swift.
 */
export async function captureAllDisplays(): Promise<ScreenCapture[]> {
  const displays = screen.getAllDisplays();
  const cursorPoint = screen.getCursorScreenPoint();

  // Get all screen sources
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: MAX_DIMENSION, height: MAX_DIMENSION },
  });

  const captures: ScreenCapture[] = [];

  for (const display of displays) {
    // Match source to display
    const source = sources.find((s) => {
      // Electron display ids and source display_id should match
      return s.display_id === String(display.id);
    }) ?? sources[captures.length]; // Fallback to index-based matching

    if (!source) continue;

    const thumbnail = source.thumbnail;
    const size = thumbnail.getSize();

    // On Windows/Linux with display scaling, the thumbnail is in physical
    // pixels but display.bounds is in logical pixels. We need to produce an
    // image whose pixel dimensions map 1:1 to the logical display bounds so
    // that Claude's pixel coordinates translate directly to OS coordinates.
    const scaleFactor = display.scaleFactor || 1;
    const logicalWidth = display.bounds.width;
    const logicalHeight = display.bounds.height;

    // Scale to fit MAX_DIMENSION while preserving aspect ratio
    let targetWidth = logicalWidth;
    let targetHeight = logicalHeight;
    const longest = Math.max(targetWidth, targetHeight);
    if (longest > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / longest;
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    const resized = thumbnail.resize({ width: targetWidth, height: targetHeight });
    const jpegBuffer = resized.toJPEG(JPEG_QUALITY);

    // Determine if cursor is on this display
    const bounds = display.bounds;
    const isCursorScreen =
      cursorPoint.x >= bounds.x &&
      cursorPoint.x < bounds.x + bounds.width &&
      cursorPoint.y >= bounds.y &&
      cursorPoint.y < bounds.y + bounds.height;

    captures.push({
      dataBase64: jpegBuffer.toString('base64'),
      displayId: display.id,
      imageWidth: targetWidth,
      imageHeight: targetHeight,
      displayBounds: bounds,
      isCursorScreen,
    });
  }

  // Sort so cursor screen is first (primary focus)
  captures.sort((a, b) => (b.isCursorScreen ? 1 : 0) - (a.isCursorScreen ? 1 : 0));

  return captures;
}
