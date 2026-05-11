"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    title: "Engleet",
    subtitle: "เรียนอังกฤษแบบสั้น กระชับ และมีแรงจูงใจเหมือนเล่นเกม",
    detail:
      "เริ่มจากบทเรียนเล็กๆ ทำ quiz เก็บ XP และค่อยๆ สร้าง streak ที่กลับมาเรียนต่อได้ทุกวัน",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=82",
  },
  {
    title: "Lessons that move",
    subtitle: "อ่านน้อยลง ลงมือทำมากขึ้น",
    detail:
      "บทเรียนถูกแบ่งเป็นช่วงสั้นพร้อมคำศัพท์สำคัญและ quiz เพื่อให้จำได้จริง ไม่ใช่แค่อ่านผ่าน",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=82",
  },
  {
    title: "Vocabulary first",
    subtitle: "คำศัพท์เดียว ใช้ซ้ำได้ทั้ง lesson, news และ dictionary",
    detail:
      "คลังคำศัพท์กลางช่วยให้การเรียนเชื่อมกันทั้งระบบ ตั้งแต่ TOEIC ไปจนถึงบทอ่านชีวิตประจำวัน",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1800&q=82",
  },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = HERO_SLIDES[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  function goToNext() {
    setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
  }

  function goToPrevious() {
    setActiveIndex(
      (current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  }

  return (
    <section className="relative isolate min-h-[calc(100svh-8rem)] overflow-hidden bg-foreground text-background">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.title}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            index === activeIndex ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={index !== activeIndex}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-8rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
        <div className="max-w-3xl space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm text-white backdrop-blur">
            <BookOpen className="size-4" />
            Gamified English learning
          </p>
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">
              {activeSlide.title}
            </h1>
            <p className="max-w-2xl text-2xl font-medium leading-snug text-white sm:text-4xl">
              {activeSlide.subtitle}
            </p>
            <p className="max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              {activeSlide.detail}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/learn/lessons">
                <Play />
                เริ่มเรียน
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/learn/vocabulary">สำรวจคำศัพท์</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="Previous hero slide"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex gap-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === activeIndex ? "w-8 bg-white" : "w-2 bg-white/45",
                )}
                aria-label={`Hero slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goToNext}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="Next hero slide"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
