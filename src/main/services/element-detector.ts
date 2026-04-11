import type { ScreenCapture, DetectedElement } from '../../shared/types';

/**
 * Detect UI element locations using Claude's Computer Use API.
 * Equivalent to ElementLocationDetector.swift.
 *
 * Parses [POINT:x,y:label:screenN] tags from Claude's response text
 * and maps pixel coordinates back to display coordinates.
 */

const POINT_TAG_REGEX = /\[POINT:(\d+),(\d+):([^:]+):screen(\d+)\]/;

export function parsePointTags(
  responseText: string,
  screenshots: ScreenCapture[],
): DetectedElement | null {
  const match = POINT_TAG_REGEX.exec(responseText);
  if (!match) return null;

  const pixelX = parseInt(match[1], 10);
  const pixelY = parseInt(match[2], 10);
  const label = match[3];
  const screenIndex = parseInt(match[4], 10);

  const screenshot = screenshots[screenIndex];
  if (!screenshot) return null;

  // Convert from screenshot pixel space to display coordinate space
  const scaleX = screenshot.displayBounds.width / screenshot.imageWidth;
  const scaleY = screenshot.displayBounds.height / screenshot.imageHeight;

  const displayX = screenshot.displayBounds.x + pixelX * scaleX;
  const displayY = screenshot.displayBounds.y + pixelY * scaleY;

  return {
    x: displayX,
    y: displayY,
    label,
    screenIndex,
  };
}
