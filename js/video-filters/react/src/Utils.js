export const loadFile = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    } catch (err) {
      reject(err)
    }
  })
}

export const createImage = async (imageSource) => {
  return new Promise((resolve, reject) => {
    try {
      const image = new Image()
      image.width = 640
      image.height = 480
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = imageSource
    } catch (err) {
      reject(err)
    }
  })
}
