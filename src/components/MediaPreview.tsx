import React from "react";
import Image from "next/image";

interface MediaPreviewProps {
  imageUrl: string;
}

const MediaPreview = ({ imageUrl }: MediaPreviewProps) => {
  return (
    <div className="my-2">
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
