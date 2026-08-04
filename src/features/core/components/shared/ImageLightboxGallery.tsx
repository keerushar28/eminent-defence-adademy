'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/features/core/components/button'

interface ImageLightboxProps {
    images: string[]
    initialIndex?: number
    isOpen: boolean
    onClose: () => void
}

export default function ImageLightbox({
    images,
    initialIndex = 0,
    isOpen,
    onClose
}: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [isZoomed, setIsZoomed] = useState(false)
    const [imageError, setImageError] = useState(false)

    // Reset states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex)
            setIsZoomed(false)
            setImageError(false)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, initialIndex])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            } else if (e.key === 'ArrowLeft') {
                handlePrevious()
            } else if (e.key === 'ArrowRight') {
                handleNext()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
        setImageError(false)
        setIsZoomed(false)
    }, [images.length])

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
        setImageError(false)
        setIsZoomed(false)
    }, [images.length])

    const handleDownload = () => {
        const link = document.createElement('a')
        link.href = images[currentIndex]
        link.download = getFileName(images[currentIndex])
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getFileName = (path: string) => {
        return path.split('/').pop() || 'image'
    }

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsZoomed(!isZoomed)
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 text-white bg-black/50 px-4 py-2 rounded-lg z-10">
                <span className="font-medium">
                    {currentIndex + 1} / {images.length}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsZoomed(!isZoomed)
                    }}
                >
                    {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDownload()
                    }}
                >
                    <Download className="h-5 w-5" />
                </Button>
            </div>

            {/* Previous Button */}
            {images.length > 1 && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 z-10"
                    onClick={(e) => {
                        e.stopPropagation()
                        handlePrevious()
                    }}
                >
                    <ChevronLeft className="h-8 w-8" />
                </Button>
            )}

            {/* Next Button */}
            {images.length > 1 && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 z-10"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleNext()
                    }}
                >
                    <ChevronRight className="h-8 w-8" />
                </Button>
            )}

            {/* Image Container */}
            <div
                className="relative w-full h-full flex items-center justify-center p-16"
                onClick={(e) => e.stopPropagation()}
            >
                {imageError ? (
                    <div className="text-white text-center">
                        <p className="text-xl mb-2">Failed to load image</p>
                        <p className="text-sm text-gray-400">{getFileName(images[currentIndex])}</p>
                    </div>
                ) : (
                    <div className={`relative transition-all duration-300 ${isZoomed ? 'max-w-5xl max-h-full' : 'w-full h-full'}`}>
                        <Image

                            src={`/api/images${images[currentIndex]}`}
                            alt={`Image ${currentIndex + 1}`}
                            width={1920}
                            height={1080}
                            className={`w-auto h-auto max-w-full max-h-full object-contain mx-auto ${isZoomed ? 'cursor-zoom-in' : 'cursor-zoom-out'
                                }`}
                            onClick={handleImageClick}
                            onError={() => setImageError(true)}
                            priority
                        />
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-5xl overflow-x-auto px-4 py-2 bg-black/50 rounded-lg z-10">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation()
                                setCurrentIndex(index)
                                setImageError(false)
                                setIsZoomed(false)
                            }}
                            className={`relative shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${index === currentIndex
                                ? 'border-white scale-110'
                                : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <Image

                                src={`/api/images${image}`}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/uploads/placeholder.png'
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}