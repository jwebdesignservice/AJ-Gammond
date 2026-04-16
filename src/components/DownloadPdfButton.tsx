'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface DownloadPdfButtonProps {
  contentId: string
  filename: string
  fullWidth?: boolean
}

export default function DownloadPdfButton({ contentId, filename, fullWidth = false }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)

    try {
      const element = document.getElementById(contentId)
      if (!element) throw new Error('Content not found')

      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 10
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2

      let currentY = margin

      // Get all direct children as sections to render individually
      const sections = Array.from(element.children) as HTMLElement[]

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        })

        const imgData = canvas.toDataURL('image/png')
        const imgHeight = (canvas.height * usableWidth) / canvas.width

        // If section doesn't fit on current page and we're not at the top, start a new page
        if (currentY + imgHeight > pageHeight - margin && currentY > margin) {
          pdf.addPage()
          currentY = margin
        }

        // If a single section is taller than a full page, it needs to be split across pages
        if (imgHeight > usableHeight) {
          let srcY = 0
          const totalSrcHeight = canvas.height
          const srcPageHeight = (usableHeight / imgHeight) * totalSrcHeight

          while (srcY < totalSrcHeight) {
            if (srcY > 0) {
              pdf.addPage()
              currentY = margin
            }

            const remainingSrc = totalSrcHeight - srcY
            const sliceHeight = Math.min(srcPageHeight, remainingSrc)
            const sliceCanvas = document.createElement('canvas')
            sliceCanvas.width = canvas.width
            sliceCanvas.height = sliceHeight

            const ctx = sliceCanvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
              ctx.drawImage(
                canvas,
                0, srcY, canvas.width, sliceHeight,
                0, 0, canvas.width, sliceHeight,
              )
            }

            const sliceImgData = sliceCanvas.toDataURL('image/png')
            const sliceImgHeight = (sliceHeight * usableWidth) / canvas.width

            pdf.addImage(sliceImgData, 'PNG', margin, currentY, usableWidth, sliceImgHeight)
            currentY += sliceImgHeight

            srcY += sliceHeight
          }
        } else {
          pdf.addImage(imgData, 'PNG', margin, currentY, usableWidth, imgHeight)
          currentY += imgHeight
        }
      }

      const safeName = filename.replace(/[^a-zA-Z0-9-_]/g, '_')
      pdf.save(`${safeName}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 bg-[#1B4332] hover:bg-[#15362a] text-white px-4 py-2.5 rounded-xl transition-colors ${fullWidth ? 'w-full' : ''}`}
      title="Download as PDF"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Download PDF
    </button>
  )
}
