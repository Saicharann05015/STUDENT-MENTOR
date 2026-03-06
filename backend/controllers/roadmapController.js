const RoadmapService = require('../services/roadmapService');
const RoadmapEngine = require('../services/roadmapEngine');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// ===== AI Roadmap Generation =====

// @desc    Generate a personalized learning roadmap via AI
// @route   POST /api/v1/roadmaps/generate
exports.generateRoadmap = asyncHandler(async (req, res) => {
    const roadmap = await RoadmapEngine.generateRoadmap(req.user.id, req.body);
    ApiResponse.created(res, { data: roadmap, message: 'Personalized roadmap generated' });
});

// @desc    Refine an existing roadmap based on feedback
// @route   PUT /api/v1/roadmaps/:id/refine
exports.refineRoadmap = asyncHandler(async (req, res) => {
    const { feedback } = req.body;
    const roadmap = await RoadmapEngine.refineRoadmap(req.params.id, req.user.id, feedback);
    ApiResponse.success(res, { data: roadmap, message: 'Roadmap refined based on your feedback' });
});

// ===== Milestone & Task Completion =====

// @desc    Complete a weekly milestone
// @route   PUT /api/v1/roadmaps/:id/milestones/:milestoneId/complete
exports.completeMilestone = asyncHandler(async (req, res) => {
    const roadmap = await RoadmapService.completeMilestone(
        req.params.id,
        req.user.id,
        req.params.milestoneId
    );
    ApiResponse.success(res, { data: roadmap, message: 'Milestone completed!' });
});

// @desc    Complete a practice task within a milestone
// @route   PUT /api/v1/roadmaps/:id/milestones/:milestoneId/tasks/:taskId/complete
exports.completeTask = asyncHandler(async (req, res) => {
    const roadmap = await RoadmapService.completeTask(
        req.params.id,
        req.user.id,
        req.params.milestoneId,
        req.params.taskId
    );
    ApiResponse.success(res, { data: roadmap, message: 'Task completed!' });
});

// @desc    Complete a project within a milestone
// @route   PUT /api/v1/roadmaps/:id/milestones/:milestoneId/projects/:projectId/complete
exports.completeProject = asyncHandler(async (req, res) => {
    const roadmap = await RoadmapService.completeProject(
        req.params.id,
        req.user.id,
        req.params.milestoneId,
        req.params.projectId
    );
    ApiResponse.success(res, { data: roadmap, message: 'Project completed!' });
});

// ===== Standard CRUD =====

// @desc    Get all roadmaps for the user
// @route   GET /api/v1/roadmaps
exports.getUserRoadmaps = asyncHandler(async (req, res) => {
    const result = await RoadmapService.getUserRoadmaps(req.user.id, req.query);
    ApiResponse.success(res, { data: result, message: 'Roadmaps retrieved' });
});

// @desc    Get single roadmap
// @route   GET /api/v1/roadmaps/:id
exports.getRoadmapById = asyncHandler(async (req, res) => {
    const roadmap = await RoadmapService.getRoadmapById(req.params.id, req.user.id);
    ApiResponse.success(res, { data: roadmap, message: 'Roadmap retrieved' });
});

// @desc    Update a roadmap
// @route   PUT /api/v1/roadmaps/:id
exports.updateRoadmap = asyncHandler(async (req, res) => {
    const roadmap = await RoadmapService.updateRoadmap(req.params.id, req.user.id, req.body);
    ApiResponse.success(res, { data: roadmap, message: 'Roadmap updated' });
});

// @desc    Delete a roadmap
// @route   DELETE /api/v1/roadmaps/:id
exports.deleteRoadmap = asyncHandler(async (req, res) => {
    const result = await RoadmapService.deleteRoadmap(req.params.id, req.user.id);
    ApiResponse.success(res, { data: result, message: 'Roadmap deleted' });
});
