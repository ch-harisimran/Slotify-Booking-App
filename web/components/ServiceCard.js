import Link from 'next/link';

export default function ServiceCard({ service }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>{service.name}</h3>
      <p className="muted" style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>
        {service.description}
      </p>
      <p style={{ margin: '0 0 16px', fontSize: '0.9rem' }}>
        {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
      </p>
      <Link href={`/services/${service.id}/book`} className="btn">
        Book
      </Link>
    </div>
  );
}
