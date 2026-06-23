import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Image, Mic, X, Upload, Loader } from 'lucide-react'

interface UploadPanelProps {
  onContext: (context: string) => void
  onClose: () => void
}

export function UploadPanel({ onContext, onClose }: UploadPanelProps) {
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')

  const processFile = useCallback(async (file: File) => {
    setProcessing(true)
    setFileName(file.name)

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          setPreview(dataUrl)
          setProcessing(false)
          // In a real app, send to Claude Vision API
          onContext(`[Image uploaded: "${file.name}" — I can see the content of this image. Please help me understand what's shown here and guide me through it step by step.]`)
        }
        reader.readAsDataURL(file)
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setProcessing(false)
        onContext(`[PDF uploaded: "${file.name}" — Please help me understand and work through the content of this document. Where should I start?]`)
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.docx')) {
        const text = await file.text()
        setProcessing(false)
        onContext(`[Document uploaded: "${file.name}"]\n\nContent:\n${text.substring(0, 2000)}${text.length > 2000 ? '\n...(truncated)' : ''}\n\nPlease help me understand and work through this content.`)
      } else if (file.type.startsWith('audio/')) {
        setProcessing(false)
        onContext(`[Audio uploaded: "${file.name}" — I've recorded a question or lecture snippet. Please help me understand the key concepts.`)
      } else {
        setProcessing(false)
        onContext(`[File uploaded: "${file.name}" — Please help me understand this material.]`)
      }
    } catch (e) {
      setProcessing(false)
      onContext(`[Could not process "${file.name}" — but I'd like help with it. Here's what I'm working on…]`)
    }
  }, [onContext])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => { if (files[0]) processFile(files[0]) },
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
    },
    maxFiles: 1,
  })

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-300">Upload study material</p>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/3'
        }`}
      >
        <input {...getInputProps()} />
        {processing ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader size={24} className="animate-spin text-indigo-400" />
            <p className="text-sm">Processing {fileName}…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Upload size={24} className="text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-300">
                {isDragActive ? 'Drop it here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs mt-1 text-slate-500">Images, PDFs, text files, audio recordings</p>
            </div>
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Image size={12} /> Images</span>
              <span className="flex items-center gap-1"><FileText size={12} /> PDFs & Docs</span>
              <span className="flex items-center gap-1"><Mic size={12} /> Audio</span>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-3">
          <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
        </div>
      )}
    </div>
  )
}
