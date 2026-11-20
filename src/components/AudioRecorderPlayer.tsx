import React, { useEffect, useRef, useState } from 'react';
import type { MediaAttachmentRef } from '../types';
import {
  getSupportedAudioMimeType,
  saveMediaLocalAndMaybeUpload,
  resolveMediaPlayableUrl,
  deleteMediaBlob,
  formatDuration,
} from '../lib/media';
import { triggerHaptic } from '../lib/haptics';
import { SFMic, SFPlay, SFPause } from './ui/SFSymbols';
import { useToast } from './ui/Primitives';

const SPEEDS = [1, 1.25, 1.5, 2];

function AudioTrackCard({
  track,
  onRename,
  onDelete,
}: {
  track: MediaAttachmentRef;
  onRename: (caption: string) => void;
  onDelete: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationSec || 0);
  const [speedIdx, setSpeedIdx] = useState(0);

  useEffect(() => {
    let active = true;
    let revokeFn = () => {};
    resolveMediaPlayableUrl(track.mediaId, track.remoteUrl).then((res) => {
      if (!active) {
        res?.revoke();
        return;
      }
      if (res) {
        setSrc(res.url);
        revokeFn = res.revoke;
      }
    });
    return () => {
      active = false;
      revokeFn();
    };
  }, [track.mediaId, track.remoteUrl]);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el || !src) return;
    triggerHaptic('light');
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      try {
        await el.play();
        setPlaying(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const cycleSpeed = () => {
    triggerHaptic('selection');
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  return (
    <div className="p-3.5 rounded-[16px] ios-elevated space-y-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? 'Tạm dừng' : 'Phát ghi âm'}
          onClick={togglePlay}
          disabled={!src}
          className="w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 ios-pressable cursor-pointer disabled:opacity-40"
          style={{ backgroundColor: 'var(--ios-blue)' }}
        >
          {playing ? <SFPause className="w-4 h-4" /> : <SFPlay className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={track.caption}
            onChange={(e) => onRename(e.target.value)}
            placeholder="Tên bản ghi âm bài giảng..."
            className="w-full bg-transparent text-[14px] font-medium truncate"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono tabular-nums text-[var(--ios-label-secondary)]">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 accent-[#007AFF] cursor-pointer"
            />
            <span className="text-[11px] font-mono tabular-nums text-[var(--ios-label-secondary)]">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-[8px] text-[11px] font-mono font-semibold tabular-nums ios-pressable cursor-pointer shrink-0"
          style={{ backgroundColor: 'var(--ios-fill-secondary)' }}
        >
          {SPEEDS[speedIdx]}x
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="text-[12px] font-medium cursor-pointer shrink-0"
          style={{ color: 'var(--ios-red)' }}
        >
          Xóa
        </button>
      </div>

      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => setPlaying(false)}
        />
      )}
    </div>
  );
}

export function AudioRecorderPlayer({
  audios,
  onChange,
}: {
  audios: MediaAttachmentRef[];
  onChange: (next: MediaAttachmentRef[]) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showToast('Trình duyệt không hỗ trợ ghi âm trực tiếp — dùng Tải file audio nhé.', 'error');
        return;
      }
      triggerHaptic('medium');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      chunksRef.current = [];
      elapsedRef.current = 0;
      setElapsedSec(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const finalMime = recorder.mimeType || mimeType || 'audio/mp4';
        const ext = finalMime.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        if (blob.size < 400) {
          setRecording(false);
          return;
        }
        const fileName = `bai-giang-${Date.now()}.${ext}`;
        const { mediaId, remoteUrl } = await saveMediaLocalAndMaybeUpload('audio', blob, fileName);
        const newRef: MediaAttachmentRef = {
          mediaId,
          fileName,
          caption: `Ghi âm bài giảng #${audios.length + 1}`,
          remoteUrl,
          durationSec: elapsedRef.current,
          createdAt: Date.now(),
        };
        onChange([...audios, newRef]);
        setRecording(false);
        showToast('Đã lưu bản ghi âm bài giảng');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSec(elapsedRef.current);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast('Chưa được cấp quyền Micro trên thiết bị.', 'error');
    }
  };

  const stopRecording = () => {
    triggerHaptic('medium');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUploadAudio = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { mediaId, remoteUrl } = await saveMediaLocalAndMaybeUpload('audio', file, file.name);
      const cleanName = file.name.replace(/\.[^.]+$/, '');
      onChange([
        ...audios,
        {
          mediaId,
          fileName: file.name,
          caption: cleanName || `File ghi âm #${audios.length + 1}`,
          remoteUrl,
          createdAt: Date.now(),
        },
      ]);
      showToast('Đã tải lên file ghi âm');
    } catch (err) {
      console.error(err);
      showToast('Không thể lưu file ghi âm.', 'error');
    } finally {
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleDelete = async (mediaId: string) => {
    await deleteMediaBlob(mediaId);
    onChange(audios.filter((a) => a.mediaId !== mediaId));
    showToast('Đã xóa bản ghi âm', 'info');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="ios-section-header">Ghi âm bài giảng ({audios.length})</span>

        <div className="flex items-center gap-2">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-[12px] font-semibold ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-red)' }}
            >
              <SFMic className="w-3.5 h-3.5" filled />
              Ghi âm
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-[12px] font-semibold tabular-nums animate-pulse cursor-pointer"
              style={{ backgroundColor: 'var(--ios-red)' }}
            >
              Dừng · {formatDuration(elapsedSec)}
            </button>
          )}

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="px-3 py-1.5 rounded-full ios-elevated text-[12px] font-semibold ios-pressable cursor-pointer"
          >
            Tải audio
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.webm"
            className="hidden"
            onChange={(e) => handleUploadAudio(e.target.files?.[0])}
          />
        </div>
      </div>

      {recording && (
        <div
          className="p-3 rounded-[14px] flex items-center justify-between"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--ios-red) 12%, transparent)',
            color: 'var(--ios-red)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--ios-red)' }} />
            <span className="text-[12px] font-medium">Đang thu âm bài giảng workflow...</span>
          </div>
          <span className="font-mono text-[14px] font-bold tabular-nums">{formatDuration(elapsedSec)}</span>
        </div>
      )}

      {audios.length === 0 && !recording ? (
        <div className="p-4 rounded-[12px] ios-fill text-center text-[13px] text-[var(--ios-label-secondary)]">
          Chưa có bản ghi âm nào. Bấm <strong>Ghi âm</strong> để giảng lại workflow bằng lời của bạn.
        </div>
      ) : (
        <div className="space-y-2">
          {audios.map((track) => (
            <AudioTrackCard
              key={track.mediaId}
              track={track}
              onRename={(caption) =>
                onChange(audios.map((a) => (a.mediaId === track.mediaId ? { ...a, caption } : a)))
              }
              onDelete={() => handleDelete(track.mediaId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
