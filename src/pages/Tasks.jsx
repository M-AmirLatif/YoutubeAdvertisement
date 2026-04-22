import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PlayCircle } from 'lucide-react';
import { api } from '../api.js';

function ensureYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });
}

function VideoTask({ video, progress, onComplete }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const [percent, setPercent] = useState(progress?.percent || 0);
  const [error, setError] = useState('');
  const completed = progress?.completed || percent >= 95;

  useEffect(() => {
    let mounted = true;
    ensureYouTubeApi().then((YT) => {
      if (!mounted || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                const duration = playerRef.current.getDuration() || video.durationSeconds;
                const current = playerRef.current.getCurrentTime() || 0;
                const nextPercent = Math.min(100, Math.round((current / duration) * 100));
                setPercent(nextPercent);
                api(`/progress/${video._id}`, {
                  method: 'POST',
                  body: JSON.stringify({ watchedSeconds: current, percent: nextPercent, completed: nextPercent >= 95 })
                }).then(({ progress: next }) => {
                  if (next.completed) onComplete(video._id, next);
                }).catch((err) => setError(err.message));
              }, 5000);
            }
            if (event.data === YT.PlayerState.ENDED) {
              api(`/progress/${video._id}`, {
                method: 'POST',
                body: JSON.stringify({ watchedSeconds: video.durationSeconds, percent: 100, completed: true })
              }).then(({ progress: next }) => onComplete(video._id, next));
            }
          }
        }
      });
    });
    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [video._id]);

  return (
    <article className="video-card">
      <div className="video-frame"><div ref={containerRef} /></div>
      <div className="video-meta">
        <div>
          <h3>{video.title}</h3>
          <span>${video.reward.toFixed(2)} reward</span>
        </div>
        <div className={completed ? 'status done' : 'status'}>
          {completed ? <CheckCircle2 size={18} /> : <PlayCircle size={18} />}
          {completed ? 'Completed' : `${percent}%`}
        </div>
      </div>
      <div className="progress-track"><span style={{ width: `${completed ? 100 : percent}%` }} /></div>
      {error && <div className="mini-alert">{error}</div>}
    </article>
  );
}

export default function Tasks() {
  const [videos, setVideos] = useState([]);
  const [progressByVideo, setProgressByVideo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/videos').then(({ videos, progress }) => {
      setVideos(videos);
      setProgressByVideo(Object.fromEntries(progress.map((item) => [item.video, item])));
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  function handleComplete(videoId, progress) {
    setProgressByVideo((current) => ({ ...current, [videoId]: progress }));
  }

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>Video tasks</h2>
        <p>Keep the video playing until it finishes. Rewards are paid once per video after the minimum watch time and daily plan limit checks pass.</p>
      </section>
      {error && <div className="alert">{error}</div>}
      <section className="video-grid">
        {loading && <div className="empty-state">Loading active video tasks...</div>}
        {videos.map((video) => (
          <VideoTask key={video._id} video={video} progress={progressByVideo[video._id]} onComplete={handleComplete} />
        ))}
        {!loading && !videos.length && <div className="empty-state">No active video tasks are available right now.</div>}
      </section>
    </div>
  );
}
