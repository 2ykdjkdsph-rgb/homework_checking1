window.TeacherSystemStore = (() => {
  const STORAGE_KEY = "teacher_system_store_v1";

  function buildSeedState() {
    return {
      levels: [
        {
          id: "undergraduate",
          name: "本科生",
          courses: [
            { id: "ug_finance_intro", name: "金融基础导论" }
          ]
        },
        {
          id: "graduate",
          name: "研究生",
          courses: [
            { id: "grad_derivatives", name: "金融创新与衍生品专题" }
          ]
        },
        {
          id: "doctor",
          name: "博士生",
          courses: [
            { id: "phd_research_method", name: "金融工程研究方法" }
          ]
        }
      ],
      studentsByCourse: {
        grad_derivatives: [
          {
            id: "202511040167",
            name: "吕翔",
            major: "金融工程",
            className: "金融工程硕士1班",
            contact: "13800000001",
            growthMetrics: {
              逻辑分析: 72,
              学术表达: 78,
              标准执行: 58,
              研究深度: 70,
              自主思考: 76
            },
            submissions: [
              {
                assignmentName: "铜产业库存周期阶段分析",
                date: "2026-02-28",
                tag: "量化意识初步形成",
                scores: { logic: 52, academic: 68, consistency: 54, standard: 40 }
              },
              {
                assignmentName: "铜产业库存周期量化归因分析",
                date: "2026-03-26",
                tag: "方法意识较强，但库存分析主线偏弱",
                scores: { logic: 58, academic: 74, consistency: 60, standard: 45 }
              }
            ]
          },
          {
            id: "202511040168",
            name: "王依梦",
            major: "金融工程",
            className: "金融工程硕士1班",
            contact: "13800000002",
            growthMetrics: {
              逻辑分析: 76,
              学术表达: 75,
              标准执行: 63,
              研究深度: 72,
              自主思考: 73
            },
            submissions: [
              {
                assignmentName: "钢铁库存周期回顾分析",
                date: "2026-02-28",
                tag: "方向贴题，结构初步完整",
                scores: { logic: 57, academic: 68, consistency: 55, standard: 48 }
              },
              {
                assignmentName: "钢铁行业库存周期分析",
                date: "2026-03-26",
                tag: "主题贴合度较高，但库存证据链未闭合",
                scores: { logic: 62, academic: 72, consistency: 59, standard: 55 }
              }
            ]
          }
        ],
        ug_finance_intro: [],
        phd_research_method: []
      }
    };
  }

  function ensureState() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSeedState()));
    }
  }

  function loadState() {
    ensureState();
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return state && typeof state === "object" ? state : buildSeedState();
    } catch {
      return buildSeedState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function listLevels() {
    return loadState().levels;
  }

  function listCourses(levelId) {
    const level = loadState().levels.find(item => item.id === levelId);
    return level ? level.courses : [];
  }

  function addCourse(payload) {
    const state = loadState();
    const level = state.levels.find(item => item.id === payload.levelId);
    if (!level) return null;
    const course = {
      id: `course_${Date.now()}`,
      name: payload.name
    };
    level.courses.push(course);
    state.studentsByCourse[course.id] = [];
    saveState(state);
    return course;
  }

  function getCourse(courseId) {
    const state = loadState();
    for (const level of state.levels) {
      const course = level.courses.find(item => item.id === courseId);
      if (course) return { ...course, levelId: level.id, levelName: level.name };
    }
    return null;
  }

  function listStudents(courseId) {
    const state = loadState();
    return state.studentsByCourse[courseId] || [];
  }

  function addStudent(courseId, payload) {
    const state = loadState();
    if (!state.studentsByCourse[courseId]) {
      state.studentsByCourse[courseId] = [];
    }
    state.studentsByCourse[courseId].push({
      id: payload.id,
      name: payload.name,
      major: payload.major,
      className: payload.className,
      contact: payload.contact,
      growthMetrics: payload.growthMetrics || {
        逻辑分析: 60,
        学术表达: 60,
        标准执行: 60,
        研究深度: 60,
        自主思考: 60
      },
      submissions: payload.submissions || []
    });
    saveState(state);
  }

  function importStudentsFromText(courseId, rawText) {
    const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) return 0;
    const rows = lines.slice(1);
    let count = 0;
    rows.forEach(line => {
      const cells = line.includes("\t") ? line.split("\t") : line.split(",");
      const [name, id, major, className, contact] = cells.map(item => (item || "").trim());
      if (!name || !id) return;
      addStudent(courseId, { name, id, major, className, contact });
      count += 1;
    });
    return count;
  }

  function getStudent(courseId, studentId) {
    return listStudents(courseId).find(item => item.id === studentId) || null;
  }

  return {
    listLevels,
    listCourses,
    addCourse,
    getCourse,
    listStudents,
    addStudent,
    importStudentsFromText,
    getStudent
  };
})();
