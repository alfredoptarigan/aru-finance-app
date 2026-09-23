import * as ImageManipulator from 'expo-image-manipulator';

// ponytail: camera/gallery JPEGs carry an EXIF rotation tag instead of rotated
// pixels. Re-encoding through ImageManipulator bakes in the correct orientation
// and strips EXIF, so backends that read raw pixel buffers don't get sideways
// images. Shared by receipt-scanner and split-bill-editor.
export async function normalizeReceiptImage(uri: string) {
  return ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
}
