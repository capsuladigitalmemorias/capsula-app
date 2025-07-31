import { useState, useRef, useEffect } from 'react'

const ImageUploader = ({ onImageChange, initialImage = null }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  // Efeito para lidar com initialImage corretamente
  useEffect(() => {
    if (!initialImage) return;
    
    // Verifica se initialImage é uma string (URL) ou um objeto File/Blob
    if (typeof initialImage === 'string') {
      // Se for uma string (URL), apenas use-a diretamente como preview
      setImagePreview(initialImage);
      setSelectedImage(null); // Não temos o objeto File, apenas a URL
    } else if (initialImage instanceof File || initialImage instanceof Blob) {
      // Se for um objeto File/Blob, crie a URL de preview
      setSelectedImage(initialImage);
      setImagePreview(URL.createObjectURL(initialImage));
    }
    
    // Limpeza ao desmontar
    return () => {
      if (imagePreview && typeof imagePreview !== 'string') {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [initialImage]);

  // Função para otimizar imagem
  const optimizeImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Definir dimensões máximas
        const maxWidth = 800
        const maxHeight = 600
        
        let { width, height } = img
        
        // Calcular novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        // Configurar canvas
        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para blob com compressão
        canvas.toBlob(
          (blob) => {
            resolve(blob)
          },
          'image/jpeg',
          0.85 // 85% de qualidade
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file) => {
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Formato não suportado. Use JPG, PNG ou WebP.')
      return
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setIsProcessing(true)

    try {
      // Otimizar imagem
      const optimizedBlob = await optimizeImage(file)
      
      // Criar arquivo otimizado
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      // Limpar URL anterior se existir e não for uma string
      if (imagePreview && typeof imagePreview !== 'string') {
        URL.revokeObjectURL(imagePreview)
      }

      const newPreviewUrl = URL.createObjectURL(optimizedFile)
      setSelectedImage(optimizedFile)
      setImagePreview(newPreviewUrl)
      onImageChange(optimizedFile)
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      alert('Erro ao processar imagem. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeImage = (e) => {
    if (e) e.preventDefault()
    
    // Limpar URL anterior se existir e não for uma string
    if (imagePreview && typeof imagePreview !== 'string') {
      URL.revokeObjectURL(imagePreview)
    }
    
    setSelectedImage(null)
    setImagePreview(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadImage = (e) => {
    if (e) e.preventDefault()
    
    if (selectedImage) {
      // Se temos o objeto File/Blob
      const url = URL.createObjectURL(selectedImage)
      const a = document.createElement('a')
      a.href = url
      a.download = `capsula-imagem-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (typeof imagePreview === 'string') {
      // Se só temos a URL (no caso de edição)
      const a = document.createElement('a')
      a.href = imagePreview
      a.download = `capsula-imagem-${Date.now()}.jpg`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Desconhecido'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
          Imagem
        </h3>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          JPG, PNG, WebP
        </span>
      </div>

      {/* Área de Upload */}
      {!imagePreview && (
        <div
          style={{
            position: 'relative',
            border: `2px dashed ${isDragging ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: isDragging ? '#dbeafe' : '#f9fafb',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            disabled={isProcessing}
            style={{ display: 'none' }}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {isProcessing ? (
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <div style={{ fontSize: '3rem' }}>🖼️</div>
              )}
            </div>
            
            <div>
              <p style={{
                fontSize: '1.125rem',
                fontWeight: '500',
                color: '#111827',
                margin: '0 0 0.25rem 0'
              }}>
                {isProcessing ? 'Processando imagem...' : 'Adicionar imagem'}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                {isProcessing 
                  ? 'Otimizando para melhor qualidade'
                  : 'Arraste uma imagem ou clique para selecionar'
                }
              </p>
            </div>

            {!isProcessing && (
              <button
                type="button"
                className="image-uploader-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                📤 Selecionar Arquivo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview da Imagem */}
      {imagePreview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', group: true }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: '100%',
                height: '16rem',
                objectFit: 'cover',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            />
            
            {/* Overlay com controles */}
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={downloadImage}
                className="image-uploader-button"
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem'
                }}
                title="Baixar imagem"
              >
                ⬇️
              </button>
              <button
                onClick={removeImage}
                className="image-uploader-button"
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem'
                }}
                title="Remover imagem"
              >
                ❌
              </button>
            </div>
          </div>

          {/* Informações do arquivo */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#dcfce7',
            borderRadius: '0.5rem',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem'
            }}>
              <div>
                <p style={{ fontWeight: '500', color: '#166534', margin: 0 }}>
                  {selectedImage ? 'Imagem otimizada' : 'Imagem carregada'}
                </p>
                <p style={{ color: '#15803d', margin: 0 }}>
                  Tamanho: {selectedImage ? formatFileSize(selectedImage.size) : 'Pré-carregada'}
                </p>
              </div>
              <div style={{ color: '#16a34a' }}>
                ✓ Pronta para upload
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>
          💡 A imagem será automaticamente otimizada para 800x600px e comprimida
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ImageUploader