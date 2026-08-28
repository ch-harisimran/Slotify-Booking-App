import Link from 'next/link';
import { IconClock, IconScissors } from './icons';

export default function ServiceCard({ service }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar avatar-lg">
          <IconScissors size={22} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{service.name}</h3>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>
            ${Number(service.price).toFixed(2)}
          </p>
        </div>
      </div>

      {service.description && (
        <p className="muted" style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
          {service.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="pill" style={{ cursor: 'default', pointerEvents: 'none' }}>
          <IconClock size={14} />
          {service.duration_minutes} min
        </span>
        <Link href={`/services/${service.id}/book`} className="btn btn-accent btn-sm">
          Book now
        </Link>
      </div>
    </div>
  );
}
