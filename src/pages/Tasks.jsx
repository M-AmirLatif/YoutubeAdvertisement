import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, PlayCircle, Maximize } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import QuizTask from '../components/QuizTask.jsx';
import SocialUnlockPanel from '../components/SocialUnlockPanel.jsx';

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
  const frameRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedRef = useRef(progress?.watchedSeconds || 0);
  const [percent, setPercent] = useState(progress?.percent || 0);
  const [error, setError] = useState('');
  const completed = progress?.completed || percent >= 90;

  async function syncProgress(forceComplete = false) {
    if (!playerRef.current?.getCurrentTime) return null;

    const duration = Number(playerRef.current.getDuration?.() || video.durationSeconds || 0);
    const currentTime = Math.max(0, Number(playerRef.current.getCurrentTime?.() || 0));
    const watchedSeconds = Math.max(progress?.watchedSeconds || 0, Math.floor(currentTime));
    const nextPercent = duration > 0
      ? Math.min(100, Math.round((watchedSeconds / duration) * 100))
      : percent;

    setPercent(nextPercent);

    if (!forceComplete && watchedSeconds <= lastSavedRef.current && nextPercent < 90) {
      return null;
    }

    const response = await api(`/progress/${video._id}`, {
      method: 'POST',
      body: JSON.stringify({
        watchedSeconds,
        percent: forceComplete ? 100 : nextPercent,
        completed: forceComplete || nextPercent >= 90
      })
    });

    lastSavedRef.current = watchedSeconds;

    if (response.progress?.completed) {
      clearInterval(intervalRef.current);
      onComplete(video._id, response.progress);
    }

    return response.progress;
  }

  function toggleFullscreen() {
    const frame = frameRef.current;
    if (!frame) return;
    if (!document.fullscreenElement) {
      const requestFullscreen =
        frame.requestFullscreen
        || frame.webkitRequestFullscreen
        || frame.msRequestFullscreen
        || frame.mozRequestFullScreen;
      requestFullscreen?.call(frame);
    } else {
      const exitFullscreen =
        document.exitFullscreen
        || document.webkitExitFullscreen
        || document.msExitFullscreen
        || document.mozCancelFullScreen;
      exitFullscreen?.call(document);
    }
  }

  useEffect(() => {
    let mounted = true;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        syncProgress().catch((err) => setError(err.message));
      }
    };

    ensureYouTubeApi().then((YT) => {
      if (!mounted || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
          controls: 1,
          disablekb: 0,
          fs: 1,
          playsinline: 1
        },
        events: {
          onReady: () => {
            const startAt = Math.max(0, Number(progress?.watchedSeconds || 0));
            const duration = Number(playerRef.current?.getDuration?.() || video.durationSeconds || 0);
            if (startAt > 0 && duration > 0 && startAt < duration - 2) {
              playerRef.current.seekTo(startAt, true);
            }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                syncProgress().catch((err) => setError(err.message));
              }, 3000);
            } else {
              clearInterval(intervalRef.current);
              if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.BUFFERING) {
                syncProgress().catch((err) => setError(err.message));
              }
            }
            if (event.data === YT.PlayerState.ENDED) {
              syncProgress(true).catch((err) => setError(err.message));
            }
          }
        }
      });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      syncProgress().catch(() => {});
      playerRef.current?.destroy?.();
    };
  }, [video._id, progress?.watchedSeconds]);

  return (
    <article className="video-card">
      <div className="video-frame" ref={frameRef}>
        <div ref={containerRef} />
        <button type="button" className="fullscreen-btn" onClick={toggleFullscreen} aria-label="Fullscreen" title="Fullscreen">
          <Maximize size={18} />
        </button>
      </div>
      <div className="video-meta">
        <div>
          <h3>{video.title}</h3>
          <span>${video.reward.toFixed(2)} reward</span>
          {!completed && <span>Watch the full video inside this website player to complete the task. You can open YouTube separately for comments or likes, but external watching does not auto-complete the task.</span>}
        </div>
        <div className="video-card-actions">
          <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="secondary video-youtube-link">
            <ExternalLink size={16} />
            Open on YouTube
          </a>
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
  const [socialLinks, setSocialLinks] = useState([]);
  const [socialFollowCompleted, setSocialFollowCompleted] = useState(Boolean(user?.socialFollowCompleted));

  useEffect(() => {
    api('/users/social-settings').then((socialData) => {
      setSocialLinks(socialData.socialLinks || []);
      setSocialFollowCompleted(Boolean(socialData.socialFollowCompleted));
      if (!socialData.socialFollowCompleted) {
        setLoading(false);
        return;
      }
      return Promise.all([
        api('/videos'),
        api('/quizzes')
      ]).then(([videoData, quizData]) => {
        setVideos(videoData.videos);
        setProgressByVideo(Object.fromEntries(videoData.progress.map((item) => [item.video, item])));
        setQuizzes(quizData.quizzes || []);
        setProgressByQuiz(Object.fromEntries((quizData.progress || []).map((item) => [item.quiz, item])));
      });
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

  if (!socialFollowCompleted) {
    return (
      <div className="tasks-page">
        <SocialUnlockPanel
          title="Follow Social Accounts"
          message="Follow all required social accounts before starting video tasks or MCQ quizzes."
          links={socialLinks}
          onUnlocked={() => window.location.reload()}
        />
      </div>
    );
  }

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
