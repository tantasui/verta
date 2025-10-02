"use client"

import { useEffect } from "react"
import { Link } from "react-router-dom"
import { DramaCard } from "../components/drama/drama-card"
import { PlaylistCarousel } from "../components/playlist/playlist-carousel"
import { Button } from "../components/ui/button"
import { Flame, TrendingUp, Heart, Zap } from "lucide-react"
import { useDramaStore } from "../lib/store"
import { mockDramas, mockPlaylists } from "../lib/mock-data"

export function HomePage() {
  const { setPlaylists } = useDramaStore()

  useEffect(() => {
    setPlaylists(mockPlaylists)
  }, [setPlaylists])

  const trendingDramas = mockDramas.slice(0, 6)
  const recentDramas = mockDramas.slice().reverse().slice(0, 4)

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden rounded-lg mx-4">
        <img src="/trending-playlist-cover.jpg" alt="Featured Drama" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div className="max-w-2xl px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Binge-Worthy <span className="text-primary">Short Dramas</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Experience emotional rollercoasters in bite-sized episodes. React, comment, and connect with every scene.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/watch">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Flame className="h-5 w-5 mr-2" />
                  Start Watching
                </Button>
              </Link>
              <Link to="/playlists">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Browse Playlists
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>
          <Link to="/playlists/trending">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingDramas.map((drama) => (
            <DramaCard key={drama.id} drama={drama} />
          ))}
        </div>
      </section>

      {/* Playlists Carousel */}
      <section className="container mx-auto px-4">
        <PlaylistCarousel playlists={mockPlaylists} />
      </section>

      {/* Recently Added */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-bold">Recently Added</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentDramas.map((drama) => (
            <DramaCard key={drama.id} drama={drama} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Browse by Mood</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Romance", icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
            { name: "Suspense", icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
            { name: "Comedy", icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10" },
            { name: "Drama", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
          ].map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.name} to={`/playlists?category=${category.name.toLowerCase()}`}>
                <div className={`p-6 rounded-lg ${category.bg} hover:scale-105 transition-transform cursor-pointer`}>
                  <Icon className={`h-8 w-8 ${category.color} mb-2`} />
                  <h3 className="font-semibold">{category.name}</h3>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
