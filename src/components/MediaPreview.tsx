import React, { JSX } from "react";
import Image from "next/image";

/**
 * Props for the MediaPreview component.
 * @interface MediaPreviewProps
 * @property {string} imageUrl - The URL of the image to be displayed.
 */
interface MediaPreviewProps {
  imageUrl: string;
}

/**
 * MediaPreview Component
 *
 * A functional React component that displays a preview of an image.
 *
 * @param {MediaPreviewProps} props - The props for the component.
 * @returns {JSX.Element} A JSX element containing the image preview.
 */
const MediaPreview = ({ imageUrl }: MediaPreviewProps): JSX.Element => {
  return (
    <div className="my-2">
      {/* Renders an image using the Next.js Image component */}
      <Image
        src={imageUrl}
        alt="Uploaded Media"
        className="rounded shadow"
        width={500}
        height={300}
      />
    </div>
  );
};

export default MediaPreview;
