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
  const completed = progress?.completed || percent >= 90;

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
                  body: JSON.stringify({ watchedSeconds: current, percent: nextPercent, completed: nextPercent >= 90 })
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
  const [surveyAnswer, setSurveyAnswer] = useState('');
  const [surveyDone, setSurveyDone] = useState(false);
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

  const completedVideos = Object.values(progressByVideo).filter((item) => item.completed).length;
  const dailyLimit = 10;
  const displayCompleted = Math.min(dailyLimit, completedVideos + (surveyDone ? 1 : 0));

  return (
    <div className="tasks-page">
      <section className="survey-progress">
        <div>
          <h2>Today's Progress</h2>
          <div className="survey-track"><span style={{ width: `${(displayCompleted / dailyLimit) * 100}%` }} /></div>
        </div>
        <strong>{displayCompleted} / {dailyLimit}</strong>
      </section>

      <section className="survey-card">
        <h2>Q: What is "Venture Capital"?</h2>
        {[
          'Money used for vacations',
          'Funding provided to startups with high growth potential',
          'Personal savings of a CEO',
          'Government taxes'
        ].map((answer) => (
          <label key={answer} className="answer-option">
            <input type="radio" name="survey" checked={surveyAnswer === answer} onChange={() => setSurveyAnswer(answer)} />
            <span>{answer}</span>
          </label>
        ))}
        <button className="primary" disabled={!surveyAnswer || surveyDone} onClick={() => setSurveyDone(true)}>
          {surveyDone ? 'Answer Submitted' : 'Submit Answer'}
        </button>
      </section>

      {error && <div className="alert">{error}</div>}
      <section className="video-grid survey-video-grid">
        {loading && <div className="empty-state">Loading active video tasks...</div>}
        {videos.map((video) => (
          <VideoTask key={video._id} video={video} progress={progressByVideo[video._id]} onComplete={handleComplete} />
        ))}
        {!loading && !videos.length && <div className="empty-state">No active video tasks are available right now.</div>}
      </section>
    </div>
  );
}
