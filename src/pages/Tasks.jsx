import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PlayCircle, Maximize } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import QuizTask from '../components/QuizTask.jsx';

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
  const accumulatedRef = useRef(progress?.watchedSeconds || 0);
  const [percent, setPercent] = useState(progress?.percent || 0);
  const [error, setError] = useState('');
  const completed = progress?.completed || percent >= 90;

  function toggleFullscreen() {
    const frame = containerRef.current?.parentElement;
    if (!frame) return;
    if (!document.fullscreenElement) {
      frame.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.();
    }
  }

  useEffect(() => {
    let mounted = true;
    ensureYouTubeApi().then((YT) => {
      if (!mounted || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin, controls: 0, disablekb: 1 },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                accumulatedRef.current += 1;
                const duration = playerRef.current.getDuration() || video.durationSeconds;
                const nextPercent = Math.min(100, Math.round((accumulatedRef.current / duration) * 100));
                
                setPercent(nextPercent);
                
                if (accumulatedRef.current % 5 === 0 || nextPercent >= 90) {
                  api(`/progress/${video._id}`, {
                    method: 'POST',
                    body: JSON.stringify({ watchedSeconds: accumulatedRef.current, percent: nextPercent, completed: nextPercent >= 90 })
                  }).then(({ progress: next }) => {
                    if (next.completed) {
                      clearInterval(intervalRef.current);
                      onComplete(video._id, next);
                    }
                  }).catch((err) => setError(err.message));
                }
              }, 1000);
            } else {
              clearInterval(intervalRef.current);
            }
            if (event.data === YT.PlayerState.ENDED) {
              const duration = playerRef.current.getDuration() || video.durationSeconds;
              if (accumulatedRef.current >= duration * 0.9) {
                api(`/progress/${video._id}`, {
                  method: 'POST',
                  body: JSON.stringify({ watchedSeconds: duration, percent: 100, completed: true })
                }).then(({ progress: next }) => onComplete(video._id, next));
              } else {
                playerRef.current.seekTo(0);
                playerRef.current.pauseVideo();
                setError('Skipping is not allowed. Please watch the full video.');
                accumulatedRef.current = 0;
                setPercent(0);
              }
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
      <div className="video-frame">
        <div ref={containerRef} />
        <button className="fullscreen-btn" onClick={toggleFullscreen} aria-label="Fullscreen" title="Fullscreen">
          <Maximize size={18} />
        </button>
      </div>
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
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progressByVideo, setProgressByVideo] = useState({});
  const [progressByQuiz, setProgressByQuiz] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('video');

  useEffect(() => {
    Promise.all([
      api('/videos'),
      api('/quizzes')
    ]).then(([videoData, quizData]) => {
      setVideos(videoData.videos);
      setProgressByVideo(Object.fromEntries(videoData.progress.map((item) => [item.video, item])));
      
      setQuizzes(quizData.quizzes || []);
      setProgressByQuiz(Object.fromEntries((quizData.progress || []).map((item) => [item.quiz, item])));
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  function handleComplete(videoId, progress) {
    setProgressByVideo((current) => ({ ...current, [videoId]: progress }));
  }

  function handleQuizComplete(quizId, progress) {
    setProgressByQuiz((current) => ({ ...current, [quizId]: progress }));
  }

  const completedVideos = Object.values(progressByVideo).filter((item) => item.completed).length;
  const dailyLimit = user?.activePlan?.dailyLimit || videos.length || 0;
  const displayCompleted = Math.min(dailyLimit, completedVideos);
  const progressPercent = dailyLimit ? (displayCompleted / dailyLimit) * 100 : 0;

  return (
    <div className="tasks-page">
      <section className="survey-progress" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Today's Progress</h2>
          <div className="survey-track"><span style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <strong>{displayCompleted} / {dailyLimit}</strong>
      </section>

      <div className="segmented-actions tight">
        <button className={activeTab === 'video' ? 'primary' : 'secondary'} onClick={() => setActiveTab('video')}>Watch Videos</button>
        <button className={activeTab === 'mcq' ? 'primary' : 'secondary'} onClick={() => setActiveTab('mcq')}>MCQ Quizzes</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {activeTab === 'video' ? (
        <section className="video-grid survey-video-grid">
          {loading && <div className="empty-state">Loading active video tasks...</div>}
          {videos.map((video) => (
            <VideoTask key={video._id} video={video} progress={progressByVideo[video._id]} onComplete={handleComplete} />
          ))}
          {!loading && !videos.length && <div className="empty-state">No active video tasks are available right now.</div>}
        </section>
      ) : (
        <section className="video-grid survey-video-grid">
          {loading && <div className="empty-state">Loading active MCQ tasks...</div>}
          {quizzes.map((quiz) => (
            <QuizTask key={quiz._id} quiz={quiz} progress={progressByQuiz[quiz._id]} onComplete={handleQuizComplete} />
          ))}
          {!loading && !quizzes.length && <div className="empty-state">No active MCQ tasks are available right now.</div>}
        </section>
      )}
    </div>
  );
}
