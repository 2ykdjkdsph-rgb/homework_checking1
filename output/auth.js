window.AuthStore = (() => {
  const USERS_KEY = "system_users_v1";
  const SESSION_KEY = "system_session_v1";
  const BYPASS_AUTH = true;

  function seedUsers() {
    return [
      {
        role: "teacher",
        name: "张老师",
        contact: "13800000011",
        workerId: "T10001",
        studentId: "",
        password: "Test@123"
      },
      {
        role: "student",
        name: "吕翔",
        contact: "13800000001",
        workerId: "",
        studentId: "202511040167",
        password: "Test@123"
      },
      {
        role: "student",
        name: "王依梦",
        contact: "13800000002",
        workerId: "",
        studentId: "202511040168",
        password: "Test@123"
      }
    ];
  }

  function ensureUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers()));
      return;
    }
    try {
      const existing = JSON.parse(raw);
      const users = Array.isArray(existing) ? existing : [];
      const merged = [...users];
      seedUsers().forEach(seed => {
        const idField = seed.role === "teacher" ? "workerId" : "studentId";
        const duplicated = merged.find(user => user.role === seed.role && user[idField] === seed[idField]);
        if (!duplicated) {
          merged.push(seed);
        }
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    } catch {
      localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers()));
    }
  }

  function loadUsers() {
    ensureUsers();
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getIdField(role) {
    return role === "teacher" ? "workerId" : "studentId";
  }

  function register(payload) {
    const role = payload.role;
    const idField = getIdField(role);
    const idValue = (payload[idField] || "").trim();
    const name = (payload.name || "").trim();
    const contact = (payload.contact || "").trim();
    const password = payload.password || "";
    const confirmPassword = payload.confirmPassword || "";

    if (!name || !idValue || !contact || !password || !confirmPassword) {
      return { ok: false, message: "请完整填写所有注册信息。" };
    }
    if (password !== confirmPassword) {
      return { ok: false, message: "两次输入的密码不一致。" };
    }

    const users = loadUsers();
    const duplicated = users.find(user => user.role === role && user[idField] === idValue);
    if (duplicated) {
      return { ok: false, message: `${role === "teacher" ? "工号" : "学号"}已注册。` };
    }

    const user = {
      role,
      name,
      contact,
      workerId: role === "teacher" ? idValue : "",
      studentId: role === "student" ? idValue : "",
      password
    };
    users.push(user);
    saveUsers(users);
    return { ok: true, user };
  }

  function login(payload) {
    const role = payload.role;
    const idField = getIdField(role);
    const idValue = (payload[idField] || "").trim();
    const password = payload.password || "";
    const user = loadUsers().find(item => item.role === role && item[idField] === idValue && item.password === password);
    if (!user) {
      return { ok: false, message: "账号或密码错误。" };
    }
    const session = {
      role: user.role,
      name: user.name,
      workerId: user.workerId,
      studentId: user.studentId,
      contact: user.contact
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user: session };
  }

  function updatePassword(payload) {
    const role = payload.role;
    const idField = getIdField(role);
    const idValue = (payload[idField] || "").trim();
    const contact = (payload.contact || "").trim();
    const password = payload.password || "";
    const confirmPassword = payload.confirmPassword || "";

    if (!idValue || !contact || !password || !confirmPassword) {
      return { ok: false, message: "请完整填写密码重置信息。" };
    }
    if (password !== confirmPassword) {
      return { ok: false, message: "两次输入的密码不一致。" };
    }

    const users = loadUsers();
    const index = users.findIndex(user => user.role === role && user[idField] === idValue && user.contact === contact);
    if (index === -1) {
      return { ok: false, message: "未找到匹配的账号信息，请检查编号和联系方式。" };
    }
    users[index].password = password;
    saveUsers(users);
    return { ok: true };
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function getFallbackUser(role) {
    return loadUsers().find(user => user.role === role) || null;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function homeForRole(role) {
    return role === "teacher" ? "./index.html" : "./student-index.html";
  }

  function requireRole(role) {
    const user = getCurrentUser();
    if (user && user.role === role) {
      return user;
    }
    if (BYPASS_AUTH) {
      return user || getFallbackUser(role);
    }
    if (!user) {
      window.location.replace("./login.html");
      return null;
    }
    window.location.replace(homeForRole(user.role));
    return null;
  }

  ensureUsers();

  return {
    register,
    login,
    updatePassword,
    getCurrentUser,
    logout,
    requireRole,
    homeForRole,
    bypassEnabled: BYPASS_AUTH
  };
})();
