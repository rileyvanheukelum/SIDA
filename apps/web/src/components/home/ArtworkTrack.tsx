
import './ArtworkTrack.css'

const artwork = [
  {
    src: '/images/hero-artwork/Ainulindale Explainer Video.jpg',
    alt: 'Ainulindale explainer video thumbnail',
  },
  {
    src: '/images/hero-artwork/Cemetery Statue.jpg',
    alt: 'Cemetery statue pencil drawing',
  },
  {
    src: '/images/hero-artwork/Chess Club Poster.png',
    alt: 'Chess Club poster',
  },
  {
    src: '/images/hero-artwork/NES Controller Advertisement.jpg',
    alt: 'NES controller advertisement',
  },
  {
    src: '/images/hero-artwork/Oppenheimer.jpg',
    alt: 'Oppenheimer portrait pencil drawing',
  },
  {
    src: '/images/hero-artwork/Stained Glass Warlock.jpg',
    alt: 'Stained glass warlock illustration',
  },
  {
    src: '/images/hero-artwork/Ocarina of Time.jpg',
    alt: 'Ocarina of Time photoshopped image',
  },
]

function ArtworkGroup({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      className="artwork-track-group"
      aria-hidden={duplicate}
    >
      {artwork.map((item, index) => (
        <div
          key={`${duplicate ? 'duplicate' : 'original'}-${index}`}
          className="artwork-track-item"
        >
          <img
            src={item.src}
            alt={duplicate ? '' : item.alt}
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}

export function ArtworkTrack() {
  return (
    <div className="artwork-track">
      <div className="artwork-track-content">
        <ArtworkGroup />
        <ArtworkGroup duplicate />
      </div>
    </div>
  )
}
