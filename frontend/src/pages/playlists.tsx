"use client"

import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { PlaylistCarousel } from "../components/playlist/playlist-carousel"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Search, Grid, List, Filter } from "lucide-react"
import { useDramaStore } from "../lib/store"
import { mockPlaylists } from "../lib/mock-data"

export function PlaylistsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category")
  const { playlists, setPlaylists } = useDramaStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(category || "all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    setPlaylists(mockPlaylists)
  }, [setPlaylists])

  const categories = ["all", "trending", "romance", "suspense", "comedy", "drama"]

  const filteredPlaylists = playlists.filter((playlist) => {
    const matchesSearch =
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      playlist.title.toLowerCase().includes(selectedCategory) ||
      playlist.description.toLowerCase().includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory)
    if (newCategory === "all") {
      setSearchParams({})
    } else {
      setSearchParams({ category: newCategory })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Discover Playlists</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Curated collections of emotional short dramas. Find your next binge-worthy series.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Playlists Carousel */}
      {selectedCategory === "all" && !searchQuery && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Featured Collections</h2>
          <PlaylistCarousel playlists={mockPlaylists.slice(0, 5)} />
        </section>
      )}

      {/* Playlists Grid/List */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory === "all"
              ? "All Playlists"
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Playlists`}
          </h2>
          <span className="text-muted-foreground">
            {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredPlaylists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No playlists found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
                setSearchParams({})
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Link key={playlist.id} to={`/playlists/${playlist.id}`}>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                      src={playlist.coverImage || "/placeholder.svg"}
                      alt={playlist.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white">
                        <span className="text-sm font-medium">{playlist.dramaCount} episodes</span>
                        <span className="text-sm">{playlist.totalDuration}min</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {playlist.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{playlist.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlaylists.map((playlist) => (
              <Link key={playlist.id} to={`/playlists/${playlist.id}`}>
                <div className="flex gap-4 p-4 rounded-lg border hover:bg-accent/5 transition-colors group">
                  <img
                    src={playlist.coverImage || "/placeholder.svg"}
                    alt={playlist.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-1">{playlist.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{playlist.dramaCount} episodes</span>
                      <span>{playlist.totalDuration}min total</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
