window.teacherAssignmentStore = (() => {
  const STORAGE_KEY = "teacher_assignments_v2";
  const DEFAULT_DETAIL_PAGE = "./金融创新与衍生品专题_作业批改结果_2026-03-26.html";

  function getDefaultStandardPreview() {
    return {
      title: "主链条",
      items: [
        "定义研究对象与库存口径",
        "画出产业链与库存分布",
        "建立供需平衡表",
        "分析库存总量与库存结构",
        "用现货流动性验证结论"
      ],
      paragraphs: [
        "本次作业优先考察库存分析主链条是否闭合，再判断扩展变量和自主框架是否真正增强了结论。"
      ],
      sourceType: "seed"
    };
  }

  function seedAssignments() {
    return [
      {
        id: "default_inventory_assignment",
        name: "大宗商品库存分析作业",
        levelId: "graduate",
        levelName: "研究生",
        courseId: "grad_derivatives",
        courseName: "金融创新与衍生品专题",
        submittedCount: 2,
        gradedCount: 2,
        createdAt: "2026-03-26",
        standardFileName: "大宗商品库存分析标准.md",
        standardPreview: getDefaultStandardPreview(),
        collectionOpen: true,
        detailPage: DEFAULT_DETAIL_PAGE,
        usesCurrentReviewData: true
      }
    ];
  }

  function ensureStorage() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAssignments()));
  }

  function normalizeAssignment(item) {
    return {
      id: item.id,
      name: item.name || "",
      levelId: item.levelId || "",
      levelName: item.levelName || "",
      courseId: item.courseId || "",
      courseName: item.courseName || "",
      submittedCount: Number(item.submittedCount || 0),
      gradedCount: Number(item.gradedCount || 0),
      createdAt: item.createdAt || "",
      standardFileName: item.standardFileName || "",
      standardPreview: item.standardPreview || getDefaultStandardPreview(),
      collectionOpen: typeof item.collectionOpen === "boolean" ? item.collectionOpen : true,
      detailPage: item.detailPage || DEFAULT_DETAIL_PAGE,
      usesCurrentReviewData: !!item.usesCurrentReviewData
    };
  }

  function loadAssignments() {
    ensureStorage();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return seedAssignments();
      return parsed.map(normalizeAssignment);
    } catch {
      return seedAssignments();
    }
  }

  function saveAssignments(assignments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments.map(normalizeAssignment)));
  }

  function listAssignments() {
    return loadAssignments();
  }

  function getAssignment(id) {
    return loadAssignments().find(item => item.id === id) || null;
  }

  function createAssignment(payload) {
    const assignments = loadAssignments();
    const assignment = normalizeAssignment({
      id: `assignment_${Date.now()}`,
      name: payload.name,
      levelId: payload.levelId,
      levelName: payload.levelName,
      courseId: payload.courseId,
      courseName: payload.courseName,
      submittedCount: payload.submittedCount,
      gradedCount: payload.gradedCount,
      createdAt: payload.createdAt,
      standardFileName: payload.standardFileName,
      standardPreview: payload.standardPreview,
      collectionOpen: payload.collectionOpen,
      detailPage: payload.detailPage,
      usesCurrentReviewData: payload.usesCurrentReviewData
    });
    assignments.unshift(assignment);
    saveAssignments(assignments);
    return assignment;
  }

  function updateAssignment(id, payload) {
    const assignments = loadAssignments();
    let updated = null;
    const nextAssignments = assignments.map(item => {
      if (item.id !== id) return item;
      updated = normalizeAssignment({
        ...item,
        name: payload.name ?? item.name,
        levelId: payload.levelId ?? item.levelId,
        levelName: payload.levelName ?? item.levelName,
        courseId: payload.courseId ?? item.courseId,
        courseName: payload.courseName ?? item.courseName,
        submittedCount: payload.submittedCount ?? item.submittedCount,
        gradedCount: payload.gradedCount ?? item.gradedCount,
        createdAt: payload.createdAt ?? item.createdAt,
        standardFileName: payload.standardFileName ?? item.standardFileName,
        standardPreview: payload.standardPreview ?? item.standardPreview,
        collectionOpen: typeof payload.collectionOpen === "boolean" ? payload.collectionOpen : item.collectionOpen,
        detailPage: payload.detailPage ?? item.detailPage,
        usesCurrentReviewData: typeof payload.usesCurrentReviewData === "boolean" ? payload.usesCurrentReviewData : item.usesCurrentReviewData
      });
      return updated;
    });
    saveAssignments(nextAssignments);
    return updated;
  }

  function toggleCollection(id) {
    const assignments = loadAssignments().map(item =>
      item.id === id ? { ...item, collectionOpen: !item.collectionOpen } : item
    );
    saveAssignments(assignments);
    return assignments.find(item => item.id === id) || null;
  }

  function deleteAssignment(id) {
    saveAssignments(loadAssignments().filter(item => item.id !== id));
  }

  function syncCurrentReviewCounts(reviewData) {
    if (!reviewData || !Array.isArray(reviewData.students)) {
      return loadAssignments();
    }
    const assignments = loadAssignments().map(item => {
      if (!item.usesCurrentReviewData) return item;
      return {
        ...item,
        submittedCount: reviewData.students.length,
        gradedCount: reviewData.students.length
      };
    });
    saveAssignments(assignments);
    return assignments;
  }

  return {
    listAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    toggleCollection,
    deleteAssignment,
    syncCurrentReviewCounts,
    getDefaultStandardPreview
  };
})();
