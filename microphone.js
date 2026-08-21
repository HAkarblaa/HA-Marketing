// HA Marketing - Global Microphone Permission Helper
// هذا الملف يجهّز المايك لكل الموقع. لا يفتح المايك تلقائياً.
// عند أي قسم لاحقاً نستدعي: HA_Microphone.request()

(function () {
  let activeStream = null;

  function supported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  async function permissionState() {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        return 'unknown';
      }
      const result = await navigator.permissions.query({ name: 'microphone' });
      return result.state || 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  async function request() {
    if (!supported()) {
      throw new Error('هذا المتصفح لا يدعم تشغيل المايك.');
    }

    // إيقاف أي بث سابق قبل فتح واحد جديد
    stop();

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      window.dispatchEvent(new CustomEvent('ha-microphone-ready', {
        detail: { stream: activeStream }
      }));

      return activeStream;
    } catch (err) {
      window.dispatchEvent(new CustomEvent('ha-microphone-error', {
        detail: { error: err }
      }));

      if (err && err.name === 'NotAllowedError') {
        throw new Error('تم رفض صلاحية المايك. فعّل المايك من إعدادات الموقع ثم حاول مرة ثانية.');
      }

      if (err && err.name === 'NotFoundError') {
        throw new Error('لا يوجد مايك متاح على هذا الجهاز.');
      }

      throw err;
    }
  }

  function stop() {
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      activeStream = null;

      window.dispatchEvent(new CustomEvent('ha-microphone-stopped'));
    }
  }

  function stream() {
    return activeStream;
  }

  function isActive() {
    return !!(
      activeStream &&
      activeStream.getAudioTracks().some(track => track.readyState === 'live')
    );
  }

  // اختبار بسيط للمايك عند الحاجة
  async function test() {
    const s = await request();

    return new Promise((resolve, reject) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        const source = ctx.createMediaStreamSource(s);
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const started = Date.now();
        let peak = 0;

        function check() {
          analyser.getByteFrequencyData(data);
          const value = Math.max(...data);
          if (value > peak) peak = value;

          if (Date.now() - started >= 1800) {
            try { ctx.close(); } catch (e) {}
            resolve({ working: peak > 5, peak });
            return;
          }

          requestAnimationFrame(check);
        }

        check();
      } catch (e) {
        reject(e);
      }
    });
  }

  window.HA_Microphone = {
    supported,
    permissionState,
    request,
    stop,
    stream,
    isActive,
    test
  };
})();
