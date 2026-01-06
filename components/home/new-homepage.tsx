"use client";

import { Navbar } from "@/components/main/Navbar";
import { Hero } from "@/components/main/Hero";
import { LiveBanner } from "@/components/main/LiveBanner";
import { ImageCarousel } from "@/components/main/ImageCarousel";
import { ServiceTimes } from "@/components/main/ServiceTimes";
import { LatestSermons } from "@/components/main/LatestSermons";
import { Community } from "@/components/main/Community";
import { WelcomeForm } from "@/components/main/WelcomeForm";
import { MainPopup } from "@/components/main/MainPopup";
import { Events } from "@/components/main/Events";
import { Photos } from "@/components/main/Photos";
import { TodayWord } from "@/components/main/TodayWord";
import { Videos } from "@/components/main/Videos";
import { Location } from "@/components/main/Location";
import { QuickLinks } from "@/components/main/QuickLinks";
import { NewcomerGuide } from "@/components/main/NewcomerGuide";

interface NewHomepageProps {
  banners?: any[];
  widgets?: any[];
  menuItems?: any[];
}

export default function NewHomepage({
  banners,
  widgets,
  menuItems,
}: NewHomepageProps) {
  const locationWidget = widgets?.find((w) => w.type === "location");
  const carouselWidget = widgets?.find((w) => w.type === "carousel");

  // 캐러셀 데이터 변환 - desktop_images 또는 mobile_images 사용
  const carouselImages =
    carouselWidget?.settings?.desktop_images?.map((img: any) => ({
      id: img.id || String(Math.random()),
      imageUrl: img.image_url,
      title: img.title,
      description: img.description,
    })) || [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar menuItems={menuItems} />
      <MainPopup />
      <Hero banners={banners} />
      {/* <ImageCarousel images={carouselImages} /> */}
      <LiveBanner />
      <QuickLinks />
      <LatestSermons />
      {/* <TodayWord /> */}
      <Events />
      <NewcomerGuide />
      <Photos />
      <Videos />
      {/* <Community /> */}
      <ServiceTimes />
      <WelcomeForm />
      <Location data={locationWidget?.display_options} />
    </div>
  );
}
