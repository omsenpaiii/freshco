'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  {
    id: 1,
    title: "Fresh fruits & vegetable",
    subtitle: "Organic Elements Store",
    desc: "100% natural, certified pesticide-free vegetables and fruits harvested daily from family-owned local farms.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    btnText: "Shop Fresh Produce",
    link: "/collections/fruits",
    accentColor: "text-primary"
  },
  {
    id: 2,
    title: "Prod of indian 100% packaging",
    subtitle: "Organic Spices & Herbs",
    desc: "Rich local Indian blends, freshly ground spices, and hand-selected whole kernels for authentic culinary tastes.",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1200&auto=format&fit=crop",
    btnText: "Explore Herbs & Grains",
    link: "/collections/dry-fruits",
    accentColor: "text-[#82ae46]"
  },
  {
    id: 3,
    title: "Fresh for your heath & mind",
    subtitle: "Natural Bakery Fresh",
    desc: "Every day freshly baked sourdough bread, croissants, muffins, and bagels using organic unbleached flour.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
    btnText: "Shop Bakery",
    link: "/collections/bread",
    accentColor: "text-primary"
  }
]

export default function HomeHeroClient() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="relative w-full h-[350px] md:h-[550px] bg-gray-150 overflow-hidden">
      {/* Slides wrap */}
      {slides.map((slide, idx) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background image */}
          <div className="absolute inset-0 bg-black/35 z-0" />
          <Image 
            src={slide.image} 
            alt={slide.title} 
            fill
            priority={idx === 0}
            className="object-cover"
          />

          {/* Text Content Overlay */}
          <div className="absolute inset-0 z-10 flex items-center px-6 md:px-20 max-w-6xl mx-auto">
            <div className="max-w-xl text-left space-y-3 md:space-y-5 text-white animate-fade-in-up">
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-white/95 px-3.5 py-1.5 rounded-full inline-block font-semibold">
                {slide.subtitle}
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-none drop-shadow-sm">
                {slide.title}
              </h1>
              <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-medium">
                {slide.desc}
              </p>
              <div className="pt-2">
                <Link 
                  href={slide.link}
                  className="bg-primary hover:bg-[#d89311] text-white font-bold text-xs md:text-sm px-6 md:px-8 py-3 rounded-full transition duration-300 shadow-md inline-block uppercase tracking-wider"
                >
                  {slide.btnText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-white text-white backdrop-blur-xs flex items-center justify-center transition cursor-pointer border border-white/20"
      >
        <ChevronLeft size={20} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-white text-white backdrop-blur-xs flex items-center justify-center transition cursor-pointer border border-white/20"
      >
        <ChevronRight size={20} />
      </button>

      {/* Pagination Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              idx === currentSlide ? 'bg-primary w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
