'use client';

import Link from 'next/link';
import { IconHeart, IconStar } from './icons';
import { getSpecialtyStyle } from '../lib/specialties';

export default function DoctorCard({ doctor, favorited = false, onToggleFavorite, size = 'md' }) {
  const compact = size === 'sm';
  const { icon: SpecialtyIcon, bg, fg } = getSpecialtyStyle(doctor.specialty);

  return (
    <div className="doctor-card">
      <Link href={`/doctors/${doctor.id}`} className="doctor-card-photo-link">
        <div className={`doctor-card-photo ${compact ? 'sm' : ''}`} style={{ background: bg }}>
          {doctor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.photo_url} alt={doctor.name} loading="lazy" />
          ) : (
            <div className="doctor-card-photo-fallback" />
          )}
          <span className="doctor-card-specialty-badge" style={{ background: bg, color: fg }}>
            <SpecialtyIcon size={13} />
          </span>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          className={`doctor-card-heart ${favorited ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(doctor);
          }}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IconHeart size={15} filled={favorited} />
        </button>
      )}

      <Link href={`/doctors/${doctor.id}`} className="doctor-card-body">
        <div className="doctor-card-rating">
          <IconStar size={12} />
          <span>{Number(doctor.rating || 4.5).toFixed(1)}</span>
        </div>
        <h3 className="doctor-card-name">{doctor.name}</h3>
        <p className="doctor-card-specialty" style={{ color: fg }}>{doctor.specialty}</p>
        <p className="doctor-card-price">${Number(doctor.price).toFixed(0)}<span>/visit</span></p>
      </Link>
    </div>
  );
}
