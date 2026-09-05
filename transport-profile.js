// HA Marketing - Transport Login/Profile Helper
(function () {

  const URL = 'https://ubayrhtshgtgggxprrek.supabase.co';
  const KEY = 'sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';

  let client = null;
  let cached = null;

  function supa() {

    if (client) return client;

    if (!window.supabase?.createClient) {
      throw new Error('Supabase client not loaded');
    }

    client = window.supabase.createClient(
      URL,
      KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'ha-marketing-auth'
        }
      }
    );

    return client;
  }


  // الحصول على المستخدم المسجل
  async function getLoggedUser() {

    const db = supa();

    // الطريقة الأولى: قراءة Session
    try {

      const {
        data: sessionData
      } = await db.auth.getSession();

      if (sessionData?.session?.user) {

        return sessionData.session.user;
      }

    } catch (e) {

      console.log(
        'getSession error:',
        e
      );
    }


    // الطريقة الثانية: getUser
    try {

      const {
        data: userData
      } = await db.auth.getUser();

      if (userData?.user) {

        return userData.user;
      }

    } catch (e) {

      console.log(
        'getUser error:',
        e
      );
    }


    // الطريقة الثالثة:
    // قراءة جلسة HA Marketing المحفوظة
    try {

      const raw =
        localStorage.getItem(
          'ha-marketing-auth'
        );

      if (raw) {

        const saved =
          JSON.parse(raw);

        const candidates = [

          saved,

          saved?.currentSession,

          saved?.session,

          saved?.data?.session

        ];

        for (const s of candidates) {

          if (s?.user?.id) {

            return s.user;
          }
        }
      }

    } catch (e) {

      console.log(
        'local session error:',
        e
      );
    }


    return null;
  }


  // جلب بيانات المستخدم
  async function current() {

    if (cached) {
      return cached;
    }

    const user =
      await getLoggedUser();

    if (!user?.id) {

      return null;
    }

    const db = supa();


    // نحاول جلب Profile
    try {

      const {
        data: profile,
        error
      } = await db
        .from('profiles')
        .select(
          'id,full_name,username,phone,account_type,employee_status,employee_role'
        )
        .eq(
          'id',
          user.id
        )
        .maybeSingle();


      // إذا Profile موجود
      if (!error && profile) {

        cached = {

          ...profile,

          user_id: user.id,

          email:
            user.email || ''

        };

        return cached;
      }

    } catch (e) {

      console.log(
        'profile error:',
        e
      );
    }


    /*
     * مهم:
     * إذا المستخدم عنده Session صحيحة
     * لكن profiles ما رجعت بيانات،
     * لا نعتبره مسجل خروج.
     */
    cached = {

      id: user.id,

      user_id: user.id,

      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        '',

      username:
        user.user_metadata?.username ||
        '',

      phone:
        user.phone ||
        user.user_metadata?.phone ||
        '',

      email:
        user.email || '',

      account_type:
        user.user_metadata?.account_type ||
        'customer',

      employee_status:
        user.user_metadata?.employee_status ||
        null,

      employee_role:
        user.user_metadata?.employee_role ||
        null
    };


    return cached;
  }


  // معلومات مركبة السائق
  function vehicle() {

    try {

      return JSON.parse(
        localStorage.getItem(
          'ha_driver_vehicle'
        ) || 'null'
      );

    } catch (e) {

      return null;
    }
  }


  function saveVehicle(v) {

    localStorage.setItem(
      'ha_driver_vehicle',
      JSON.stringify(
        v || {}
      )
    );
  }


  // الزبون
  async function customerOrLogin() {

    const p =
      await current();


    if (!p?.id) {

      alert(
        'لازم تسجل الدخول بحسابك أولاً حتى ترسل الطلب.'
      );

      location.href =
        'login.html';

      return null;
    }


    return {

      id: p.id,

      user_id: p.id,

      name:
        p.full_name ||
        p.username ||
        p.email ||
        'الزبون',

      phone:
        p.phone || '',

      email:
        p.email || ''
    };
  }


  // بيانات السائق
  async function driverIdentity() {

    const p =
      await current();


    if (!p?.id) {

      return {

        ok: false,

        message:
          'لازم تسجل الدخول بحساب الموظف أولاً.'
      };
    }


    if (
      p.account_type !==
      'employee'
    ) {

      return {

        ok: false,

        message:
          'واجهة السائق مخصصة لحسابات الموظفين فقط.'
      };
    }


    if (
      p.employee_status !==
      'approved'
    ) {

      return {

        ok: false,

        message:
          'حساب الموظف لازم يكون موافق عليه من الإدارة قبل استقبال الطلبات.'
      };
    }


    const v =
      vehicle() || {};


    if (
      !v.plate ||
      !v.carName ||
      !v.carColor
    ) {

      return {

        ok: false,

        needsVehicle: true,

        profile: p,

        message:
          'أدخل معلومات المركبة الحقيقية أولاً.'
      };
    }


    return {

      ok: true,

      profile: p,

      driver: {

        userId:
          p.id,

        name:
          p.full_name ||
          p.username ||
          'السائق',

        phone:
          p.phone || '',

        plate:
          v.plate,

        carName:
          v.carName,

        carColor:
          v.carColor,

        rating:
          '—',

        photo:
          ''
      }
    };
  }


  // إذا تغير تسجيل الدخول نمسح الكاش
  try {

    supa()
      .auth
      .onAuthStateChange(
        function () {

          cached = null;
        }
      );

  } catch (e) {

    console.log(
      'auth listener error:',
      e
    );
  }


  window.HA_TransportProfile = {

    current,

    customerOrLogin,

    driverIdentity,

    vehicle,

    saveVehicle

  };

})();
