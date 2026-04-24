import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Youtube } from 'lucide-react';
import { api } from '../api.js';

function getEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    return `https://www.youtube.com/embed/${url.split('v=')[1].split('&')[0]}`;
  }
  if (url.includes('youtu.be/')) {
    return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`;
  }
  return url;
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.courses.list()
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen color="var(--brand-blue)" /> YouTube Automation Course
        </h2>
        <p>Learn how to automate and earn through YouTube.</p>
      </section>

      {error && <div className="alert">{error}</div>}

      <div className="video-grid">
        {loading && <div className="empty-state">Loading courses...</div>}
        {courses.map((course) => (
          <article key={course._id} className="video-card">
            <div className="video-frame">
              <iframe
                src={getEmbedUrl(course.videoUrl)}
                title={course.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="video-meta">
              <div>
                <h3>{course.title}</h3>
                <span style={{ display: 'block', marginTop: '8px', marginBottom: '16px' }}>{course.description}</span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href={course.videoUrl} target="_blank" rel="noopener noreferrer" className="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 12px' }}>
                    <ExternalLink size={14} /> Watch on YouTube
                  </a>
                  {course.channelUrl && (
                    <a href={course.channelUrl} target="_blank" rel="noopener noreferrer" className="danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 12px', background: '#dc2626', color: 'white', border: 'none' }}>
                      <Youtube size={14} /> Subscribe
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
        {!loading && !courses.length && <div className="empty-state">No courses are available right now.</div>}
      </div>
    </div>
  );
}
