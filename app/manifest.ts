import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeuroCare - Éducateurs Spécialisés en Autisme',
    short_name: 'NeuroCare',
    description: 'Trouvez un éducateur spécialisé qualifié en autisme et TSA près de chez vous',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [],
  }
}
