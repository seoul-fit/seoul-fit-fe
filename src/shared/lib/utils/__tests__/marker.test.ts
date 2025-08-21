import { 
  createMarkerElement,
  getMarkerImage,
  formatInfoWindowContent
} from '../marker'

describe('Marker Utils', () => {
  describe('createMarkerElement', () => {
    it('creates a marker element with correct classes', () => {
      const element = createMarkerElement('restaurant')
      
      expect(element).toBeInstanceOf(HTMLDivElement)
      expect(element.className).toContain('marker')
      expect(element.className).toContain('restaurant-marker')
    })

    it('applies custom classes', () => {
      const element = createMarkerElement('park', 'custom-class')
      
      expect(element.className).toContain('marker')
      expect(element.className).toContain('park-marker')
      expect(element.className).toContain('custom-class')
    })

    it('handles special marker types', () => {
      const clusterElement = createMarkerElement('cluster')
      expect(clusterElement.className).toContain('cluster-marker')
      
      const userElement = createMarkerElement('user')
      expect(userElement.className).toContain('user-marker')
    })
  })

  describe('getMarkerImage', () => {
    it('returns correct marker image for facility types', () => {
      const restaurantImage = getMarkerImage('restaurant')
      expect(restaurantImage.src).toContain('restaurant')
      expect(restaurantImage.size).toBeDefined()
      
      const parkImage = getMarkerImage('park')
      expect(parkImage.src).toContain('park')
    })

    it('returns default marker for unknown types', () => {
      const unknownImage = getMarkerImage('unknown')
      expect(unknownImage.src).toContain('default')
    })

    it('applies custom size to marker image', () => {
      const customSize = { width: 50, height: 50 }
      const image = getMarkerImage('library', customSize)
      
      expect(image.size).toEqual(customSize)
    })
  })

  describe('formatInfoWindowContent', () => {
    it('formats basic facility info correctly', () => {
      const facility = {
        name: '테스트 도서관',
        address: '서울시 강남구',
        phone: '02-1234-5678'
      }
      
      const content = formatInfoWindowContent(facility)
      
      expect(content).toContain('테스트 도서관')
      expect(content).toContain('서울시 강남구')
      expect(content).toContain('02-1234-5678')
    })

    it('handles missing fields gracefully', () => {
      const facility = {
        name: '테스트 시설'
      }
      
      const content = formatInfoWindowContent(facility)
      
      expect(content).toContain('테스트 시설')
      expect(content).not.toContain('undefined')
      expect(content).not.toContain('null')
    })

    it('includes operating hours when available', () => {
      const facility = {
        name: '테스트 공원',
        operatingHours: '09:00 - 18:00'
      }
      
      const content = formatInfoWindowContent(facility)
      
      expect(content).toContain('09:00 - 18:00')
    })

    it('escapes HTML in content', () => {
      const facility = {
        name: '<script>alert("XSS")</script>',
        address: 'Test & Address'
      }
      
      const content = formatInfoWindowContent(facility)
      
      expect(content).not.toContain('<script>')
      expect(content).toContain('&lt;script&gt;')
      expect(content).toContain('&amp;')
    })
  })
})