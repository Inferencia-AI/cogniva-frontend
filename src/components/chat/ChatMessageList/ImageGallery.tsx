import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// =============================================================================
// ImageGallery - Displays images in a carousel/swiper format
// =============================================================================

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  if (!images.length) return null;

  return (
    <div className="pt-small">
      <Swiper
        modules={[Navigation, Pagination]}
        slidesPerView={1}
        spaceBetween={12}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="w-full rounded-md overflow-hidden bg-secondary/10 border border-accent/20 h-48"
      >
        {images.map((imgSrc: string, imgIndex: number) => (
          <SwiperSlide key={`img-${imgIndex}`} className="w-full h-full">
            <div className="w-full h-full flex items-center justify-center bg-primary">
              <img
                src={imgSrc}
                alt={`Source ${imgIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

